"""
Serviços para Exportações Automáticas Governamentais
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

import json
import csv
import pandas as pd
import io
import zipfile
import hashlib
import smtplib
import uuid
from django.utils.text import slugify
from calendar import monthrange
from datetime import datetime, date, timedelta, time
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string

from .models import (
    TipoExportacao, AgendamentoExportacao, ExecucaoExportacao,
    TemplateExportacao, HistoricoExportacao, DestinacaoExportacao
)
from caixa_entrada.models import CaixaEntrada
from cip_automatica.models import CIPAutomatica
from audiencia_calendario.models import AgendamentoAudiencia
from portal_cidadao.models import ReclamacaoDenuncia
from logging_config import logger_manager, LoggedOperation, log_execution_time


class ExportacaoService:
    """Serviço principal de exportações governamentais"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('exportacoes_service')
    
    @log_execution_time('executar_exportacao')
    def executar_exportacao(self, agendamento: AgendamentoExportacao, usuario_executor: User) -> ExecucaoExportacao:
        """
        Executa uma exportação agendada para órgão governamental.
        """
        
        with LoggedOperation('executar_exportacao', {
            'agendamento_id': agendamento.id,
            'tipo_export': agendamento.tipo_exportacao.codigo,
            'periodo': f"{agendamento.periodo_de.date()} a {agendamento.periodo_ate.date()}",
            'usuario_executor': usuario_executor.username,
        }):
            try:
                # Criar execução
                with transaction.atomic():
                    execucao = ExecucaoExportacao.objects.create(
                        agendamento=agendamento,
                        status='EM_EXECUCAO'
                    )
                    
                    self._registrar_historico(agendamento, 'INICIADA_EXECUCAO', 
                                            f'Execução da exportação iniciada por {usuario_executor.username}')
                    
                    # Coletar dados
                    dados_exportacao = self._coletar_dados_periodo(
                        agendamento.periodo_de, 
                        agendamento.periodo_ate,
                        agendamento.tipo_exportacao.tipos_documentos_incluir,
                        agendamento.tipo_exportacao.filtros_aplicar
                    )
                    
                    execucao.total_consulta_db = dados_exportacao['total_consultas']
                    execucao.save()
                    
                    self._registrar_historico(agendamento, 'DADOS_COLLECTED', 
                                            f'{dados_exportacao["total_registros"]} registros coletados')
                    
                    # Processar dados
                    arquivo_gerado = self._processar_e_gerar_arquivo(
                        dados_exportacao, 
                        agendamento.tipo_exportacao,
                        agendamento.parametros_especificos
                    )
                    
                    execucao.registros_processados = dados_exportacao['total_registros']
                    execucao.arquivos_gerados = [arquivo_gerado['nome_arquivo']]
                    execucao.stats_processamento = dados_exportacao['stats']
                    execucao.save()
                    
                    self._registrar_historico(agendamento, 'GERADO_ARCHIVO', 
                                            f'Arquivo {arquivo_gerado["nome_arquivo"]} gerado com sucesso')
                    
                    # Validar conteúdo
                    if agendamento.tipo_exportacao.validação_obrigatoria:
                        validacoes = self._validar_conteudo_arquivo(arquivo_gerado, agendamento.tipo_exportacao)
                        execucao.validações_realizadas = validacoes
                        execucao.save()
                        
                        self._registrar_historico(agendamento, 'VALIDADO_CONTEUDO', 
                                                f'{len(validacoes["success"])} validações realizadas com sucesso')
                    
                    # Salvar arquivo no agendamento
                    agendamento.arquivo_gerado = arquivo_gerado['content']
                    agendamento.status = 'CONCLUIDA'
                    agendamento.data_execucao_fim = timezone.now()
                    agendamento.save()
                    
                    # Finalizar execução
                    execucao.status = 'CONCLUIDA'
                    execucao.data_fim = timezone.now()
                    execucao.save()
                    
                    self._registrar_historico(agendamento, 'CONCLUII_EXECUCAO', 
                                            f'Exportação concluída com sucesso. Relatórios gerados.')
                    
                    # Notificar se necessário
                    if agendamento.tipo_exportacao.enviar_email_notificacao:
                        self._enviar_notificacao_conclusao(agendamento, usuario_executor)
                    
                    self.logger.log_operation('exportacao_concluida', {
                        'agendamento_id': agendamento.id,
                        'execucao_id': execucao.id,
                        'arquivo_size_mb': execucao.tamanho_dados_processados_mb,
                        'tempo_execucao': execucao.data_fim.timestamp() - execucao.data_inicio.timestamp(),
                    })
                    
                    return execucao
                    
            except Exception as e:
                self.logger.error(f'Erro na execução da exportação: {str(e)}', exc_info=True)
                
                agendamento.status = 'ERRO'
                agendamento.data_execucao_fim = timezone.now()
                agendamento.log_execucao = str(e)
                agendamento.save()
                
                self._registrar_historico(agendamento, 'ERRO_PROCESSAMENTO', str(e))
                
                raise e
    
    @log_execution_time('coletar_dados_periodo')
    def _coletar_dados_periodo(self, data_inicio: datetime, data_fim: datetime, 
                              tipos_documentos: List[str], filtros: Dict[str, Any]) -> Dict[str, Any]:
        """Coleta dados dos módulos específicos para um período"""
        
        dados_collectados = {
            'reclamacoes': [],
            'cips': [],
            'audiencias': [],
            'caixa_entrada': [],
            'total_registros': 0,
            'total_consultas': 0,
            'stats': {}
        }
        
        agora = timezone.now()
        
        # Reclamações do Portal Cidadão
        if 'reclamacoes' in tipos_documentos:
            try:
                reclamacoes = ReclamacaoDenuncia.objects.filter(
                    data_criacao__gte=data_inicio,
                    data_criacao__lte=data_fim
                ).select_related('consumidor', 'empresa')
                
                # Aplicar filtros específicos
                if filtros.get('status_reclamacao'):
                    reclamacoes = reclamacoes.filter(status__in=filtros['status_reclamacao'])
                
                if filtros.get('tipo_reclamacao'):
                    reclamacoes = reclamacoes.filter(tipo_reclamacao__in=filtros['tipo_reclamacao'])
                
                dados_collectados['reclamacoes'] = list(reclamacoes.values(
                    'id', 'numero_protocolo', 'assunto', 'tipo_reclamacao', 'status',
                    'data_criacao', 'consumidor_nome', 'consumidor_cpf', 'consumidor_email',
                    'empresa_razao_social', 'empresa_cnpj', 'valor_reclamado'
                ))
                dados_collectados['total_registros'] += len(dados_collectados['reclamacoes'])
                dados_collectados['total_consultas'] += 1
                
            except Exception as e:
                self.logger.error(f'Erro ao coletar reclamações: {str(e)}')
        
        # CIPs Automáticas
        if 'cips' in tipos_documentos:
            try:
                cips = CIPAutomatica.objects.filter(
                    data_geracao__gte=data_inicio,
                    data_geracao__lte=data_fim
                ).select_related('tipo_cip', 'responsavel_producao')
                
                dados_collectados['cips'] = list(cips.values(
                    'id', 'numero_cip', 'numero_protocolo', 'status', 'data_geracao',
                    'data_envio_fornecedor', 'valor_total', 'orgao_razao_social', 'responsavel_producao__username',
                    'prazo_resposta_empresa', 'prazo_acordo_pagamento'
                ))
                dados_collectados['total_registros'] += len(dados_collectados['cips'])
                dados_collectados['total_consultas'] += 1
                
            except Exception as e:
                self.logger.error(f'Erro ao coletar CIPs: {str(e)}')
        
        # Audiências de Conciliação
        if 'audiencias' in tipos_documentos:
            try:
                audiencias = AgendamentoAudiencia.objects.filter(
                    data_agendamento__gte=data_inicio,
                    data_agendamento__lte=data_fim
                ).select_related('mediador', 'local', 'criado_por')
                
                dados_collectados['audiencias'] = list(audiencias.values(
                    'id', 'numero_protocolo', 'tipo_audiencia', 'status', 'data_agendamento',
                    'modalidade', 'mediador__usuario__username', 'local__nome', 
                    'houve_acordo', 'valor_acordo', 'detalhes_acordo', 'criado_por__username'
                ))
                dados_collectados['total_registros'] += len(dados_collectados['audiencias'])
                dados_collectados['total_consultas'] += 1
                
            except Exception as e:
                self.logger.error(f'Erro ao coletar audiências: {str(e)}')
        
        # Caixa de Entrada
        if 'caixa_entrada' in tipos_documentos:
            try:
                caixa_docs = CaixaEntrada.objects.filter(
                    data_entrada__gte=data_inicio,
                    data_entrada__lte=data_fim
                ).select_related('responsavel_atual')
                
                dados_collectados['caixa_entrada'] = list(caixa_docs.values(
                    'id', 'numero_protocolo', 'assunto', 'tipo_documento', 'status',
                    'data_entrada', 'setor_destino', 'responsavel_atual__username', 'prioridade'
                ))
                dados_collectados['total_registros'] += len(dados_collectados['caixa_entrada'])
                dados_collectados['total_consultas'] += 1
                
            except Exception as e:
                self.logger.error(f'Erro ao coletar caixa entrada: {str(e)}')
        
        # Gerar estatísticas
        dados_collectados['stats'] = self._gerar_stats_colecao(dados_collectados)
        
        return dados_collectados
    
    def _processar_e_gerar_arquivo(self, dados: Dict[str, Any], tipo_exportacao: TipoExportacao, 
                                 parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Processa dados e gera arquivo no formato específico"""
        
        nome_arquivo = self._gerar_nome_arquivo(tipo_exportacao, parametros)
        
        if tipo_exportacao.formato_arquivo == 'JSON':
            content, arquivo_info = self._gerar_arquivo_json(dados, tipo_exportacao, parametros)
        elif tipo_exportacao.formato_arquivo == 'CSV':
            content, arquivo_info = self._gerar_arquivo_csv(dados, tipo_exportacao, parametros)
        elif tipo_exportacao.formato_arquivo == 'XLSX':
            content, arquivo_info = self._gerar_arquivo_excel(dados, tipo_exportacao, parametros)
        elif tipo_exportacao.formato_arquivo == 'XML':
            content, arquivo_info = self._gerar_arquivo_xml(dados, tipo_exportacao, parametros)
        else:
            content, arquivo_info = self._gerar_arquivo_txt(dados, tipo_exportacao, parametros)
        
        return {
            'nome_arquivo': nome_arquivo,
            'content': ContentFile(content),
            'size_bytes': len(content),
            'info': arquivo_info
        }
    
    def _gerar_arquivo_json(self, dados: Dict[str, Any], tipo_exportacao: TipoExportacao, 
                          parametros: Dict[str, Any]) -> Tuple[bytes, Dict[str, Any]]:
        """Gera arquivo JSON estruturado"""
        
        estrutura_arquivo = {
            'metadados': {
                'orgao_destino': tipo_exportacao.orgao_destino_nome,
                'tipo_exportacao': tipo_exportacao.nome_exibicao,
                'periodo_relatorio': {
                    'inicio': parametros.get('data_inicio'),
                    'fim': parametros.get('data_fim'),
                },
                'data_geracao': timezone.now().isoformat(),
                'versao_formato': '1.0',
                'identificador_unico': f"EXP-{uuid.uuid4().hex[:16]}",
            },
            'estatisticas': dados['stats'],
            'registros': dados
        }
        
        json_content = json.dumps(estrutura_arquivo, ensure_ascii=False, indent=4)
        
        return json_content.encode('utf-8'), {
            'registros_reclamacoes': len(dados['reclamacoes']),
            'registros_cips': len(dados['cips']),
            'registros_audiencias': len(dados['audiencias']),
            'registros_caixa': len(dados['caixa_entrada']),
            'total_registros': dados['total_registros']
        }
    
    def _gerar_arquivo_csv(self, dados: Dict[str, Any], tipo_exportacao: TipoExportacao, 
                         parametros: Dict[str, Any]) -> Tuple[bytes, Dict[str, Any]]:
        """Gera arquivo CSV com dados estruturados"""
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=',', lineterminator='\n')
        
        # Métadados (linhas comentadas)
        writer.writerow(['# Relatório Gerado:', tipo_exportacao.nome_exibicao])
        writer.writerow(['# Órgão Destino:', tipo_exportacao.orgao_destino_nome])
        writer.writerow(['# Data Geração:', timezone.now().strftime('%d/%m/%Y %H:%M:%S')])
        writer.writerow(['# Período:', f"{parametros.get('data_inicio')} a {parametros.get('data_fim')}"])
        writer.writerow(['# Total Registros:', dados['total_registros']])
        writer.writerow([])
        
        # Headers por tipo de registro
        all_headers = set()
        for tipo_dados in ['reclamacoes', 'cips', 'audiencias', 'caixa_entrada']:
            if dados[tipo_dados]:
                all_headers.update(dados[tipo_dados][0].keys())
        
        headers_complete = ['tipo_registro', 'data_evento'] + sorted(all_headers)
        writer.writerow(headers_complete)
        
        # Registrar cada tipo de dados
        for tipo_registro in ['reclamacoes', 'cips', 'audiencias', 'caixa_entrada']:
            for registro in dados[tipo_registro]:
                linha_valores = [tipo_registro]
                linha_valores.append(registro.get('data_criacao') or registro.get('data_agendamento') or 
                                  registro.get('data_entrada') or '')
                
                for header in sorted(all_headers):
                    linha_valores.append(str(registro.get(header, '')))
                
                writer.writerow(linha_valores)
        
        csv_content = output.getvalue().encode('utf-8')
        
        def _extrair_stats_from_csv_content(content: bytes) -> Dict[str, int]:
            stats = {'registros_reclamacoes': 0, 'registros_cips': 0, 
                    'registros_audiencias': 0, 'registros_caixa': 0}
            
            content_str = content.decode('utf-8')
            lines = content_str.split('\n')[7:]  # Exclude metadata headers
            
            for line in lines:
                if not line.strip():
                    continue
                tipo_registro = line.split(',')[0]  # First column is tipo_registro
                if f'{tipo_registro}_registros' in stats:
                    stats[f'{tipo_registro}_registros'] += 1
            
            stats['total_registros'] = sum(stats.values())
            return stats
        
        return csv_content, _extrair_stats_from_csv_content(csv_content)
    
    def _gerar_nome_arquivo(self, tipo_exportacao: TipoExportacao, parametros: Dict[str, Any]) -> str:
        """Gera nome único para arquivo de exportação"""
        
        data_geracao = timezone.now().strftime('%Y%m%d_%H%M%S')
        codigo_orgao = slugify(tipo_exportacao.orgao_destino_nome)[:10]
        uuid_short = str(uuid.uuid4().hex[:8])
        
        extensao = tipo_exportacao.formato_arquivo.lower()
        if extensao == 'excel':
            extensao = 'xlsx'
        elif extensao == 'javascript':
            extensao = 'json'
        
        nome = f"{tipo_exportacao.codigo}_{codigo_orgao}_{data_geracao}_{uuid_short}.{extensao}"
        return nome
    
    def _gerar_stats_colecao(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        """Gera estatísticas dos dados coletados"""
        
        stats = {
            'quantidades': {
                'reclamacoes': len(dados['reclamacoes']),
                'cips': len(dados['cips']), 
                'audiencias': len(dados['audiencias']),
                'caixa_entrada': len(dados['caixa_entrada']),
            },
            'periodo': {
                'data_coleta': timezone.now().isoformat(),
                'total_registros': dados['total_registros'],
                'total_consutas_db': dados['total_consultas'],
            },
            'sumarios': []
        }
        
        # Sumário por status (exemplo para reclamações)
        if dados['reclamacoes']:
            status_counts = {}
            for rec in dados['reclamacoes']:
                status = rec.get('status', 'N/A')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            stats['sumarios'].append({
                'entidade': 'reclamacoes',
                'status_counts': status_counts,
                'total': len(dados['reclamacoes'])
            })
        
        return stats
    
    def _validar_conteudo_arquivo(self, arquivo_info: Dict[str, Any], tipo_exportacao: TipoExportacao) -> List[Dict[str, Any]]:
        """Validações específicas por tipo de exportação"""
        
        validacoes = []
        
        try:
            # Validação básica de tamanho
            tamanho_min_kb = 1
            if tipo_exportacao.codigo in ['REL_MENSAL_PROCON_SP', 'REL_TRIMESTRAL_ACAS']:
                tamanho_min_kb = 10
            
            size_kb = arquivo_info['size_bytes'] / 1024
            validacoes.append({
                'nome': 'tamanho_arquivo_suficiente',
                'sucesso': size_kb >= tamanho_min_kb,
                'descricao': f'Arquivo tem {size_kb:.1f}KB (mínimo: {tamanho_min_kb}KB)'
            })
            
            # Validação de formato específico
            extensao_esperada = tipo_exportacao.formato_arquivo.lower()
            nome_arquivo = arquivo_info['nome_arquivo']
            
            validacoes.append({
                'nome': 'formato_arquivo_correto',
                'sucesso': nome_arquivo.endswith(f'.{extensao_esperada}'),
                'descricao': f'Arquivo com extensão {extensao_esperada}: {nome_arquivo}'
            })
            
            # Validação de estrutura JSON (se aplicável)
            if extensao_esperada == 'json':
                try:
                    content_str = arquivo_info['content'].read().decode('utf-8')
                    json_loaded = json.loads(content_str)
                    
                    validacoes.append({
                        'nome': 'json_estrutura_valida',
                        'sucesso': 'metadados' in json_loaded and 'registros' in json_loaded,
                        'descricao': 'JSON válido com estrutura esperada'
                    })
                    
                    arquivo_info['content'].seek(0)  # Reset stream
                    
                except json.JSONDecodeError:
                    validacoes.append({
                        'nome': 'json_estrutura_valida',
                        'sucesso': False,
                        'descricao': 'JSON inválido'
                    })
            
        except Exception as e:
            validacoes.append({
                'nome': 'validacao_generica',
                'sucesso': False,
                'descricao': str(e)
            })
        
        success_validacoes = [v for v in validacoes if v['sucesso']]
        stats_validation = {
            'total_validacoes': len(validacoes),
            'sucess_completos': len(success_validacoes),
            'falhas': len(validacoes) - len(success_validacoes),
        }
        
        validacoes_final = {
            'validacoes': validacoes,
            'stats': stats_validation,
            'success': [v for v in validacoes if v['sucesso']],
            'failures': [v for v in validacoes if not v['sucesso']],
        }
        
        return validacoes_final
    
    def _enviar_notificacao_conclusao(self, agendamento: AgendamentoExportacao, usuario: User):
        """Envia notificação de conclusão da exportação"""
        
        subject = f"[PROCON Export] {agendamento.tipo_exportacao.nome_exibicao} Concluída"
        
        html_message = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                .content {{ margin-top: 20px; }}
                .info {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PROCON - Exportações Governamentais</h1>
            </div>
            
            <div class="content">
                <h2>Relatório Concluído</h2>
                <p>Olá, {usuario.first_name or usuario.username}!</p>
                
                <p>O <strong>{agendamento.tipo_exportacao.nome_exibicao}</strong> foi gerado com sucesso:</p>
                
                <div class="info">
                    <h3>Detalhes da Exportação:</h3>
                    <p><strong>Órgão Destino:</strong> {agendamento.tipo_exportacao.orgao_destino_nome}</p>
                    <p><strong>Período:</strong> {agendamento.periodo_de.date()} a {agendamento.periodo_ate.date()}</p>
                    <p><strong>Número de Registros:</strong> {agendamento.execucoes.last().registros_processados if agendamento.execucoes.exists() else 'N/A'}</p>
                    <p><strong>Data de Conclusão:</strong> {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                </div>
                
                <p>O arquivo está disponível no sistema e pode ser acessado através do acesso administrativo.</p>
                
                <p><em>Atenciosamente,<br>Sistema de Exportações PROCON</em></p>
            </div>
        </body>
        </html>
        """
        
        try:
            email_envio = EmailMessage(
                subject=subject,
                body=html_message,
                from_email='noreply@procon.local',
                to=[usuario.email],
            )
            email_envio.content_subtype = 'html'
            email_envio.send()
            
            self.logger.info(f'Notificação enviada para {usuario.email}')
            
        except Exception as e:
            self.logger.error(f'Erro ao enviar notificação: {str(e)}')
    
    def _registrar_historico(self, agendamento: AgendamentoExportacao, evento_acao: str, descricao: str):
        """Registra evento no histórico da exportação"""
        
        HistoricoExportacao.objects.create(
            agendamento=agendamento,
            evento_acao=evento_acao,
            descricao_evento=descricao,
        )


class SchedulerExportacaoService:
    """Serviço para agendamento automático de exportações"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('scheduler_exportacao')
    
    @log_execution_time('agendar_todas_automaticas')
    def agendar_todas_automaticas(self) -> int:
        """
        Agenda todas as exportações configuradas como automáticas.
        Retorna número de agendamentos criados.
        """
        
        tipos_automaticas = TipoExportacao.objects.filter(
            ativo=True,
            frequencia_automatica__in=['SEMANAL', 'MENSAL', 'TRIMESTRAL', 'ANUAL']  # ≠ 'MANUAL'
        )
        
        agendamentos_criados = 0
        
        for tipo in tipos_automaticas:
            proxima_execucao = self._calcular_proxima_execucao_auto(tipo)
            
            if proxima_execucao:
                try:
                    AgendamentoExportacao.objects.get_or_create(
                        tipo_exportacao=tipo,
                        periodo_de=self._periodo_de_aquela_data(proxima_execucao),
                        periodo_ate=self._periodo_ate_aquela_data(proxima_execucao),
                        defaults={
                            'status': 'AGENDA',  # Sem espaço, valor do choices
                            'parametros_especificos': {
                                'agendamento_automatico': True,
                                'proxima_frequencia_calculada': tipo.frequencia_automatica,
                            },
                        }
                    )
                    agendamentos_criados += 1
                    
                    self.logger.info(f'Agendamento automático criado: {tipo.nome_exibicao} para {proxima_execucao.date()}')
                    
                except Exception as e:
                    self.logger.error(f'Erro ao agendar automaticamente {tipo.nome_exibicao}: {str(e)}')
        
        return agendamentos_criados
    
    @log_execution_time('executar_proximas_agendadas')
    def executar_proximas_agendadas(self, usuario_executor: User) -> List[ExecucaoExportacao]:
        """
        Executa agendamentos que estão prontos para serem processados.
        """
        
        agora = timezone.now()
        
        agendamentos_prontos = AgendamentoExportacao.objects.filter(
            status='AGENDA',
            data_agendamento__lte=agora,
        )
        
        execucoes = []
        exportacao_service = ExportacaoService()
        
        for agendamento in agendamentos_prontos:
            try:
                execucao = exportacao_service.executar_exportacao(agendamento, usuario_executor)
                execucoes.append(execucao)
                
            except Exception as e:
                self.logger.error(f'Erro na execução do agendamento {agendamento.id}: {str(e)}')
        
        return execucoes
    
    @log_execution_time('calcular_proxima_execucao_auto')
    def _calcular_proxima_execucao_auto(self, tipo: TipoExportacao) -> Optional[datetime]:
        """
        Calcula próxima data de execução automática baseada em frequência e últimos agendamentos.
        """
        
        agora = timezone.now()
        
        # Verificar última execução
        ultimo_agendamento = AgendamentoExportacao.objects.filter(
            tipo_exportacao=tipo,
            data_execucao_fim__isnull=False,
        ).order_by('-data_execucao_fim').first()
        
        if ultimo_agendamento:
            data_base = ultimo_agendamento.data_execucao_fim
        else:
            # Se nunca executou, usar última segunda-feira para começar limpo
            dias_desde_segunda = agora.weekday()
            data_base = agora.date() - timedelta(days=dias_desde_segunda)
            data_base = timezone.make_aware(datetime.combine(data_base, time(10, 0, 0)))
        
        # Calcular próxima execução baseada na frequência
        proxima_execucao = None
        
        if tipo.frequencia_automatica == 'SEMANAL':
            proxima_execucao = data_base + timedelta(days=7)
        elif tipo.frequencia_automatica == 'MENSAL':
            proxima_execucao = data_base + timedelta(days=30)
        elif tipo.frequencia_automatica == 'TRIMESTRAL':
            proxima_execucao = data_base + timedelta(days=90)
        elif tipo.frequencia_automatica == 'ANUAL':
            proxima_execucao = data_base + timedelta(days=365)
        
        return proxima_execucao if proxima_execucao and proxima_execucao > agora else None
    
    @log_execution_time('periodo_de_aquela_data')
    def _periodo_de_aquela_data(self, data_execucao: datetime) -> datetime:
        """
        Calcula ponto inicial do período que será relatado em uma determinada data de execução.
        Ex: Execução de dezembro reporta dados de novembro.
        """
        
        if data_execucao.month == 1:
            mes_anterior_desde = data_execucao.replace(year=data_execucao.year - 1, month=12, day=1)
        else:
            mes_anterior_desde = data_execucao.replace(month=data_execucao.month - 1, day=1)
        
        return mes_anterior_desde
    
    @log_execution_time('periodo_ate_aquela_data')
    def _periodo_ate_aquela_data(self, data_execucao: datetime) -> datetime:
        """
        Calcula fim do período que será relatado em uma determinada data de execução.
        Ex: Fim de novembro para relatório executado em dezembro.
        """
        
        if data_execucao.month == 1:
            mes_anterior_fim = data_execucao.replace(year=data_execucao.year - 1, month=12, day=31, hour=23, minute=59, second=59)
        else:
            # Último dia do mês anterior
            ultimo_dia = monthrange(data_execucao.year, data_execucao.month - 1)[1]
            mes_anterior_fim = data_execucao.replace(month=data_execucao.month - 1, day=ultimo_dia, hour=23, minute=59, second=59)
        
        return mes_anterior_fim


# Instâncias globais dos serviços
exportacao_service = ExportacaoService()
scheduler_service = SchedulerExportacaoService()
