"""
Serviços para análise de respostas empresariais
Sistema Procon - Fase 4 - Fluxo Completo do Atendimento
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction, models
from django.core.mail import send_mail
from django.conf import settings

from cip_automatica.models import CIPAutomatica, RespostaEmpresa, TipoCIP
from caixa_entrada.models import CaixaEntrada
from logging_config import logger_manager, LoggedOperation, log_execution_time


class AnaliseRespostaService:
    """Serviço para análise inteligente de respostas empresariais"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('analise_resposta')
        
        # Padrões para análise automatizada
        self.padroes_aceitacao = [
            r'\baceito\b', r'\baceita\b', r'\bconcordo\b', r'\bconcordamos\b',
            r'\bpago\b', r'\bpagarei\b', r'\bpagar\s+(?:o\s+)?valor\b',
            r'\breconhecemos?\b', r'\badmitimos?\b', r'\bassumimos?\b',
            r'\bacordo\b', r'\bfavorável\b', r'\bpositivo\b'
        ]
        
        self.padroes_recusa = [
            r'\bnão\s+aceito\b', r'\bnão\s+aceita\b', r'\bnão\s+concordo\b',
            r'\brecuso\b', r'\brecusamos?\b', r'\brejeito\b',
            r'\bnão\s+responsável\b', r'\bnão\s+fomos\s+nos\b',
            r'\binfrangido\b', r'\bdescabido\b', r'\binfundado\b',
            r'\bnão\s+verdade\b', r'\bnão\s+responsabilid\w+\b',
            r'\bcancelado\b', r'\brescindido\b'
        ]
        
        self.padroes_mediacao = [
            r'\bmedicação\b', r'\bconcíliação\b', r'\bconciliação\b',
            r'\bnegociação\b', r'\bmediação\b', r'\bdialógo\b',
            r'proposta\s+de', r'oferta\s+de', r'sugestão\s+de',
            r'alternativa\s+de', r'solução\s+alternativa'
        ]
    
    @log_execution_time('analisar_resposta_empresa')
    def analisar_resposta_recebida(self, cip_id: str, texto_resposta: str,
                                 valor_oferecido: Optional[float] = None,
                                 usuario_analista: Any = None) -> RespostaEmpresa:
        """Analisa resposta empresarial usando IA/NLP"""
        
        with LoggedOperation('analisar_resposta_empresa', {
            'cip_id': cip_id,
            'tem_texto': len(texto_resposta) > 0,
            'tem_valor': valor_oferecido is not None,
        }):
            try:
                # Buscar CIP
                cip = CIPAutomatica.objects.get(id=cip_id)
                
                # Análise automatizada
                analise_ia = self._executar_analise_ia(texto_resposta, valor_oferecido, cip.valor_total)
                
                # Determinar tipo de resposta
                tipo_resposta = self._determinar_tipo_resposta(texto_resposta, analise_ia)
                
                # Calcular status inicial
                status_inicial = self._calcular_status_inicial(tipo_resposta, analise_ia)
                
                with transaction.atomic():
                    # Criar registro da resposta
                    resposta = RespostaEmpresa.objects.create(
                        cip=cip,
                        tipo_resposta=tipo_resposta,
                        status=status_inicial,
                        texto_resposta=texto_resposta,
                        valor_oferecido=valor_oferecido,
                        prazo_pagamento_oferecido=analise_ia.get('prazo_oferecido'),
                        responsavel_analise=usuario_analista,
                        dados_análise_ia=analise_ia,
                    )
                    
                    # Atualizar status da CIP
                    self._atualizar_status_cip(cip, tipo_resposta, resposta)
                    
                    # Registrar histórico
                    self._registrar_historico_analise(resposta, analise_ia, usuario_analista)
                    
                    # Log da análise
                    self.logger.log_operation('resposta_analisada', {
                        'resposta_id': resposta.id,
                        'cip_id': cip.id,
                        'tipo_resposta': tipo_resposta,
                        'status': status_inicial,
                        'confianca_ia': analise_ia.get('confianca', 0),
                        'valor_oferecido': valor_oferecido,
                    })
                    
                    return resposta
                    
            except Exception as e:
                self.logger.error(f'Erro na análise de resposta: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('analise_ia')
    def _executar_analise_ia(self, texto: str, valor_oferecido: Optional[float], 
                           valor_solicitado: float) -> Dict[str, Any]:
        """Executa análise automatizada usando padrões e regras"""
        
        texto_lower = texto.lower()
        
        # Contagem de padrões
        aceitacao_matches = sum(1 for pattern in self.padroes_aceitacao 
                              if re.search(pattern, texto_lower, re.IGNORECASE))
        recusa_matches = sum(1 for pattern in self.padroes_recusa 
                            if re.search(pattern, texto_lower, re.IGNORECASE))
        mediacao_matches = sum(1 for pattern in self.padroes_mediacao 
                              if re.search(pattern, texto_lower, re.IGNORECASE))
        
        # Análise de sentimento básica
        sentimento_score = (aceitacao_matches * 2 - recusa_matches * 2 + mediacao_matches)
        
        # Análise de valor oferecido
        analise_valor = self._analisar_valor_oferecido(valor_oferecido, valor_solicitado)
        
        # Calcular confiança na análise
        confianca = min(95, max(30, 
            (abs(sentimento_score) * 10 + 
             analise_valor['confiabilidade'] + 
             len(texto) / 10)
        ))
        
        # Detectar prazo oferecido
        prazo_oferecido = self._extrair_prazo_pagamento(texto_lower)
        
        # Identificar palavras-chave importantes
        palavras_chave = self._extrair_palavras_chave(texto_lower)
        
        return {
            'sentimento_score': sentimento_score,
            'aceitacao_matches': aceitacao_matches,
            'recusa_matches': recusa_matches,
            'mediacao_matches': mediacao_matches,
            'analise_valor': analise_valor,
            'confianca': confianca,
            'prazo_oferecido': prazo_oferecido,
            'palavras_chave': palavras_chave,
            'tamanho_texto': len(texto),
        }
    
    def _determinar_tipo_resposta(self, texto: str, analise_ia: Dict[str, Any]) -> str:
        """Determina tipo de resposta baseado na IA"""
        
        score = analise_ia['sentimento_score']
        confianca = analise_ia['confianca']
        
        if score > 2 and confianca > 70:
            if analise_ia['analise_valor']['percentual'] >= 90:
                return 'ACEITA_TOTALMENTE'
            elif analise_ia['analise_valor']['percentual'] >= 30:
                return 'ACEITA_PARCIALMENTE'
            else:
                return 'SOLICITA_MEDIACAO'
        elif score < -1 and confianca > 60:
            return 'RECUSA_COM_JUSTIFICATIVA'
        elif analise_ia['mediacao_matches'] > 0:
            return 'SOLICITA_MEDIACAO'
        elif analise_ia['confianca'] < 50:
            return 'SOLICITA_PROVAS'
        else:
            return 'PROPOSTA_CONTESTACAO'  # Categoria padrão para casos ambíguos
    
    def _calcular_status_inicial(self, tipo_resposta: str, analise_ia: Dict[str, Any]) -> str:
        """Calcula status inicial baseado no tipo de resposta"""
        
        status_mapping = {
            'ACEITA_TOTALMENTE': 'ACEITA',
            'ACEITA_PARCIALMENTE': 'ACEITA',
            'RECUSA_COM_JUSTIFICATIVA': 'REJEITADA',
            'SOLICITA_MEDIACAO': 'AGUARDANDO_COMPLEMENTO',
            'SOLICITA_PROVAS': 'AGUARDANDO_COMPLEMENTO',
            'OBJETA_PROCESSO': 'REJEITADA',
            'PROPOSTA_CONTESTACAO': 'ANALISANDO',
        }
        
        return status_mapping.get(tipo_resposta, 'ANALISANDO')
    
    def _analisar_valor_oferecido(self, valor_oferecido: Optional[float], 
                                valor_solicitado: float) -> Dict[str, Any]:
        """Analisa valor oferecido em relação ao solicitado"""
        
        if not valor_oferecido:
            return {
                'percentual': 0,
                'categoria': 'VAZIO',
                'confiabilidade': 0,
                'recomendacao': 'PEDIR_VALOR'
            }
        
        percentual = (valor_oferecido / valor_solicitado) * 100
        
        if percentual >= 90:
            categoria = 'APROXIMADAMENTE_INTEGRAL'
            recomendacao = 'ACEITAR'
            confiabilidade = 85
        elif percentual >= 70:
            categoria = 'PARCIAL_ELEVADO'
            recomendacao = 'AVALIAR_NEGOCIACAO'
            confiabilidade = 80
        elif percentual >= 50:
            categoria = 'PARCIAL_MODERADO'
            recomendacao = 'NEGOCIAR'
            confiabilidade = 75
        elif percentual >= 20:
            categoria = 'PARCIAL_BAIXO'
            recomendacao = 'NEGOCIAR_DURAMENTE'
            confiabilidade = 70
        else:
            categoria = 'SIMBOLICA'
            recomendacao = 'RECUSAR_OU_NEGOCIAR'
            confiabilidade = 65
        
        return {
            'percentual': percentual,
            'categoria': categoria,
            'confiabilidade': confiabilidade,
            'recomendacao': recomendacao,
            'valor_oferecido': valor_oferecido,
            'valor_solicitado': valor_solicitado,
        }
    
    def _extrair_prazo_pagamento(self, texto: str) -> Optional[int]:
        """Extrai prazo de pagamento oferecido em dias"""
        
        # Padrões para prazo em dias
        patterns = [
            r'(\d+)\s*dias?',
            r'(\d+)\s*d',
            r'(\d+)\s*dias?\s+útil',
            r'(\d+)\s*de\s+dias?',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, texto)
            if match:
                dias = int(match.group(1))
                return min(dias, 365)  # Limitar a 1 ano
        
        # Padrões para prazo em meses
        patterns_meses = [
            r'(\d+)\s*meses?',
            r'(\d+)\s*m',
            r'(\d+)\s*mês',
        ]
        
        for pattern in patterns_meses:
            match = re.search(pattern, texto)
            if match:
                meses = int(match.group(1))
                return min(meses * 30, 365)
        
        return None
    
    def _extrair_palavras_chave(self, texto: str) -> List[str]:
        """Extrai palavras-chave importantes da resposta"""
        
        # Palavras importantes para análise
        keywords_core = [
            'contrato', 'garantia', 'reparo', 'devolução', 'manutenção',
            'política', 'termo', 'condição', 'vigência', 'prazo',
            'responsabilidade', 'obrigação', 'compromisso', 'acordo',
            'multa', 'juros', 'correção', 'atualização',
        ]
        
        palavras_encontradas = []
        for keyword in keywords_core:
            if keyword in texto:
                palavras_encontradas.append(keyword)
        
        return palavras_encontradas[:10]  # Máximo 10 palavras-chave
    
    @log_execution_time('atualizar_status_cip')
    def _atualizar_status_cip(self, cip: CIPAutomatica, tipo_resposta: str, 
                             resposta: RespostaEmpresa):
        """Atualiza status da CIP baseado na resposta"""
        
        # Mapeamento de tipos para status de CIP
        status_mapping = {
            'ACEITA_TOTALMENTE': 'ACEITA_EMPRESA',
            'ACEITA_PARCIALMENTE': 'RESPONDIDA_EMPRESA',
            'RECUSA_COM_JUSTIFICATIVA': 'RECUSADA_EMPRESA',
            'SOLICITA_MEDIACAO': 'PRODUCAO_JURIDICA',
            'SOLICITA_PROVAS': 'PRODUCAO_JURIDICA',
            'OBJETA_PROCESSO': 'PRODUCAO_JURIDICA',
            'PROPOSTA_CONTESTACAO': 'RESPONDIDA_EMPRESA',
        }
        
        novo_status = status_mapping.get(tipo_resposta, 'RESPONDIDA_EMPRESA')
        
        if cip.status != novo_status:
            cip.status = novo_status
            cip.save()
            
            self.logger.info(f'CIP {cip.numero_cip} atualizada para status: {novo_status}')
    
    @log_execution_time('registrar_historico')
    def _registrar_historico_analise(self, resposta: RespostaEmpresa, 
                                   analise_ia: Dict[str, Any], usuario: Any):
        """Registra histórico da análise realizada"""
        
        from audiencia_calendario.models import HistoricoAudiencia  # Import local para evitar circular import
        
        # Registrar no histórico da CIP relacionada
        HistoricoAudiencia.objects.create(
            agendamento=None,  # Seria None por não estar em audiência ainda
            tipo_evento='RESPOSTA_ANALISADA',
            descricao=f'Resposta empresarial analisada via IA: {resposta.tipo_resposta}',
            dados_novos={
                'analise_ia': analise_ia,
                'resposta_id': resposta.id,
                'confianca': analise_ia.get('confianca', 0),
            },
            usuario_responsavel=usuario,
        )


class RelatorioRespostaService:
    """Serviço para relatórios de respostas empresariais"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('relatorio_resposta')
    
    @log_execution_time('gerar_relatorio_respostas')
    def gerar_relatorio_periodo(self, data_inicio: datetime, data_fim: datetime) -> Dict[str, Any]:
        """Gera relatório de respostas empresariais por período"""
        
        respostas = RespostaEmpresa.objects.filter(
            data_recebimento__range=[data_inicio, data_fim]
        )
        
        # Métricas básicas
        total_respostas = respostas.count()
        
        # Respostas por tipo
        respostas_portipo = {}
        for tipo, _ in RespostaEmpresa.TIPO_RESPOSTA_COMMONS:
            count = respostas.filter(tipo_resposta=tipo).count()
            if count > 0:
                respostas_portipo[tipo] = count
        
        # Respostas por status
        respostas_porstatus = {}
        for status, _ in RespostaEmpresa.STATUS_CHOICES:
            count = respostas.filter(status=status).count()
            if count > 0:
                respostas_porstatus[status] = count
        
        # Análise de valores
        respostas_com_valor = respostas.exclude(valor_oferecido__isnull=True)
        valores_totais = respostas_com_valor.aggregate(
            soma_oferecida=Sum('valor_oferecido'),
            count_com_valor=models.Count('id')
        )
        
        # Taxa de aceitação pela empresa
        aceitas = respostas.filter(status='ACEITA')
        taxa_aceitacao = (aceitas.count() / total_respostas * 100) if total_respostas > 0 else 0
        
        # Tempo médio de análise
        tempo_medio_analise = respostas.filter(
            status__in=['ACEITA', 'REJEITADA'],
            data_decisao__isnull=False
        ).aggregate(
            tempo_medio=Avg(F('data_decisao') - F('data_recebimento'))
        )['tempo_medio']
        
        # Empresas mais responsivas
        empresas_top = respostas.values(
            'cip__empresa_razao_social'
        ).annotate(
            count=Count('id'),
            tempo_resposta=Avg(F('data_recebimento') - F('cip__data_geracao'))
        ).order_by('-count')[:10]
        
        relatorio = {
            'periodo': {'inicio': data_inicio.date(), 'fim': data_fim.date()},
            'total_respostas': total_respostas,
            'respostas_por_tipo': respostas_portipo,
            'respostas_por_status': respostas_porstatus,
            'valores_totais': valores_totais,
            'taxa_aceitacao': taxa_aceitacao,
            'tempo_medio_analise': str(tempo_medio_analise) if tempo_medio_analise else None,
            'empresas_mais_responsivas': list(empresas_top),
            'tendencias': self._calcular_tendencias(respostas),
        }
        
        self.logger.log_operation('relatorio_respostas_gerado', {
            'periodo': str(data_inicio.date()) + ' a ' + str(data_fim.date()),
            'total_respostas': total_respostas,
            'taxa_aceitacao': taxa_aceitacao,
        })
        
        return relatorio
    
    def _calcular_tendencias(self, respostas) -> Dict[str, Any]:
        """Calcula tendências nas respostas"""
        
        # Tendência por tipo de resposta (últimos 30 dias vs anteriores)
        agora = timezone.now()
        ultimos_30_dias = agora - timedelta(days=30)
        
        respostas_recentes = respostas.filter(data_recebimento__gte=ultimos_30_dias)
        respostas_anteriores = respostas.filter(data_recebimento__lt=ultimos_30_dias)
        
        tendencias = {}
        
        # Comparar tipos de resposta
        tipos_a_comparar = ['ACEITA_TOTALMENTE', 'ACEITA_PARCIALMENTE', 'RECUSA_COM_JUSTIFICATIVA']
        
        for tipo in tipos_a_comparar:
            recente_count = respostas_recentes.filter(tipo_resposta=tipo).count()
            anterior_count = respostas_anteriores.filter(tipo_resposta=tipo).count()
            
            if anterior_count > 0:
                variacao = ((recente_count - anterior_count) / anterior_count) * 100
                tendencias[f'tipo_{tipo}'] = {
                    'variacao_percentual': variacao,
                    'recente': recente_count,
                    'anterior': anterior_count,
                }
        
        return tendencias


# Instâncias globais dos serviços
analise_service = AnaliseRespostaService()
relatorio_resposta_service = RelatorioRespostaService()
