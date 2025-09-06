#!/usr/bin/env python
"""
Serviços avançados para o módulo de relatórios
Inclui: exportações específicas, integração com BI avançado
"""

import json
import csv
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models import Q, Count, Sum, Avg, Max, Min
from .models import Relatorio, TipoRelatorio, RelatorioAgendado, TemplateRelatorio
import io
import base64
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import requests
import uuid

logger = logging.getLogger(__name__)


class ExportacaoEspecificaService:
    """Serviço para exportações específicas de relatórios"""
    
    def __init__(self):
        self.supported_formats = ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML', 'XML', 'ODT']
        self.max_records = 100000  # Limite de registros para exportação
    
    def exportar_relatorio_fiscalizacao(self, relatorio: Relatorio) -> Dict[str, Any]:
        """Exporta relatório específico de fiscalização"""
        try:
            from fiscalizacao.models import AutoInfracao, Fiscalizacao
            
            # Buscar dados de fiscalização
            queryset = AutoInfracao.objects.all()
            
            # Aplicar filtros
            filtros = relatorio.filtros
            if filtros.get('data_inicio'):
                queryset = queryset.filter(data_fiscalizacao__gte=filtros['data_inicio'])
            if filtros.get('data_fim'):
                queryset = queryset.filter(data_fiscalizacao__lte=filtros['data_fim'])
            if filtros.get('tipo_estabelecimento'):
                queryset = queryset.filter(tipo_estabelecimento=filtros['tipo_estabelecimento'])
            if filtros.get('status'):
                queryset = queryset.filter(status=filtros['status'])
            
            # Limitar registros
            total_records = queryset.count()
            if total_records > self.max_records:
                queryset = queryset[:self.max_records]
            
            # Preparar dados
            dados = []
            for auto in queryset:
                dados.append({
                    'numero': auto.numero,
                    'data_fiscalizacao': auto.data_fiscalizacao.strftime('%d/%m/%Y'),
                    'estabelecimento': auto.razao_social,
                    'cnpj': auto.cnpj,
                    'tipo': auto.tipo_estabelecimento,
                    'valor_multa': float(auto.valor_multa) if auto.valor_multa else 0,
                    'status': auto.status,
                    'fiscal': auto.fiscal_nome,
                    'infracoes': auto.infracoes.count() if hasattr(auto, 'infracoes') else 0
                })
            
            # Exportar no formato solicitado
            resultado = self._exportar_dados(dados, relatorio.formato, relatorio.titulo)
            
            return {
                'sucesso': True,
                'arquivo': resultado['arquivo'],
                'registros_processados': len(dados),
                'total_registros': total_records,
                'formato': relatorio.formato
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação de relatório de fiscalização: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def exportar_relatorio_multas(self, relatorio: Relatorio) -> Dict[str, Any]:
        """Exporta relatório específico de multas"""
        try:
            from multas.models import Multa
            
            # Buscar dados de multas
            queryset = Multa.objects.all()
            
            # Aplicar filtros
            filtros = relatorio.filtros
            if filtros.get('data_inicio'):
                queryset = queryset.filter(data_aplicacao__gte=filtros['data_inicio'])
            if filtros.get('data_fim'):
                queryset = queryset.filter(data_aplicacao__lte=filtros['data_fim'])
            if filtros.get('status'):
                queryset = queryset.filter(status=filtros['status'])
            if filtros.get('valor_min'):
                queryset = queryset.filter(valor__gte=filtros['valor_min'])
            if filtros.get('valor_max'):
                queryset = queryset.filter(valor__lte=filtros['valor_max'])
            
            # Limitar registros
            total_records = queryset.count()
            if total_records > self.max_records:
                queryset = queryset[:self.max_records]
            
            # Preparar dados
            dados = []
            for multa in queryset:
                dados.append({
                    'numero': multa.numero,
                    'data_aplicacao': multa.data_aplicacao.strftime('%d/%m/%Y'),
                    'empresa': multa.empresa.razao_social if multa.empresa else '',
                    'cnpj': multa.empresa.cnpj if multa.empresa else '',
                    'valor': float(multa.valor) if multa.valor else 0,
                    'status': multa.status,
                    'vencimento': multa.data_vencimento.strftime('%d/%m/%Y') if multa.data_vencimento else '',
                    'pago': 'Sim' if multa.pago else 'Não',
                    'valor_pago': float(multa.valor_pago) if multa.valor_pago else 0
                })
            
            # Exportar no formato solicitado
            resultado = self._exportar_dados(dados, relatorio.formato, relatorio.titulo)
            
            return {
                'sucesso': True,
                'arquivo': resultado['arquivo'],
                'registros_processados': len(dados),
                'total_registros': total_records,
                'formato': relatorio.formato
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação de relatório de multas: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def exportar_relatorio_juridico(self, relatorio: Relatorio) -> Dict[str, Any]:
        """Exporta relatório específico jurídico"""
        try:
            from juridico.models import ProcessoJuridico, ParecerJuridico
            
            # Buscar dados jurídicos
            queryset = ProcessoJuridico.objects.all()
            
            # Aplicar filtros
            filtros = relatorio.filtros
            if filtros.get('data_inicio'):
                queryset = queryset.filter(data_abertura__gte=filtros['data_inicio'])
            if filtros.get('data_fim'):
                queryset = queryset.filter(data_abertura__lte=filtros['data_fim'])
            if filtros.get('status'):
                queryset = queryset.filter(status=filtros['status'])
            if filtros.get('analista'):
                queryset = queryset.filter(analista_id=filtros['analista'])
            
            # Limitar registros
            total_records = queryset.count()
            if total_records > self.max_records:
                queryset = queryset[:self.max_records]
            
            # Preparar dados
            dados = []
            for processo in queryset:
                pareceres = ParecerJuridico.objects.filter(processo=processo)
                dados.append({
                    'numero': processo.numero,
                    'data_abertura': processo.data_abertura.strftime('%d/%m/%Y'),
                    'parte': processo.parte,
                    'assunto': processo.assunto,
                    'status': processo.status,
                    'analista': processo.analista.user.get_full_name() if processo.analista else '',
                    'valor_causa': float(processo.valor_causa) if processo.valor_causa else 0,
                    'total_pareceres': pareceres.count(),
                    'pareceres_assinados': pareceres.filter(assinatura_digital__isnull=False).count(),
                    'dias_processo': (timezone.now() - processo.data_abertura).days
                })
            
            # Exportar no formato solicitado
            resultado = self._exportar_dados(dados, relatorio.formato, relatorio.titulo)
            
            return {
                'sucesso': True,
                'arquivo': resultado['arquivo'],
                'registros_processados': len(dados),
                'total_registros': total_records,
                'formato': relatorio.formato
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação de relatório jurídico: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def _exportar_dados(self, dados: List[Dict], formato: str, titulo: str) -> Dict[str, Any]:
        """Exporta dados no formato especificado"""
        try:
            if formato == 'PDF':
                return self._exportar_pdf(dados, titulo)
            elif formato == 'EXCEL':
                return self._exportar_excel(dados, titulo)
            elif formato == 'CSV':
                return self._exportar_csv(dados, titulo)
            elif formato == 'JSON':
                return self._exportar_json(dados, titulo)
            elif formato == 'HTML':
                return self._exportar_html(dados, titulo)
            elif formato == 'XML':
                return self._exportar_xml(dados, titulo)
            else:
                raise ValueError(f"Formato não suportado: {formato}")
                
        except Exception as e:
            logger.error(f"Erro na exportação: {e}")
            raise
    
    def _exportar_pdf(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em PDF"""
        try:
            # Criar buffer para o PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            
            # Estilos
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=30
            )
            
            # Título
            elements.append(Paragraph(titulo, title_style))
            elements.append(Spacer(1, 12))
            
            if dados:
                # Cabeçalhos
                headers = list(dados[0].keys())
                
                # Preparar dados da tabela
                table_data = [headers]
                for row in dados:
                    table_data.append([str(row.get(header, '')) for header in headers])
                
                # Criar tabela
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                elements.append(table)
            
            # Gerar PDF
            doc.build(elements)
            buffer.seek(0)
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(buffer.getvalue())
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(buffer.getvalue())
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação PDF: {e}")
            raise
    
    def _exportar_excel(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em Excel"""
        try:
            # Criar DataFrame
            df = pd.DataFrame(dados)
            
            # Criar buffer para o Excel
            buffer = io.BytesIO()
            
            # Escrever Excel
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Dados', index=False)
                
                # Adicionar gráficos se houver dados numéricos
                if len(dados) > 0:
                    self._adicionar_graficos_excel(writer, df)
            
            buffer.seek(0)
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(buffer.getvalue())
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(buffer.getvalue())
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação Excel: {e}")
            raise
    
    def _exportar_csv(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em CSV"""
        try:
            # Criar buffer para o CSV
            buffer = io.StringIO()
            
            if dados:
                # Escrever cabeçalhos
                writer = csv.DictWriter(buffer, fieldnames=dados[0].keys())
                writer.writeheader()
                
                # Escrever dados
                writer.writerows(dados)
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(buffer.getvalue().encode('utf-8'))
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(buffer.getvalue().encode('utf-8'))
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação CSV: {e}")
            raise
    
    def _exportar_json(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em JSON"""
        try:
            # Preparar dados JSON
            json_data = {
                'titulo': titulo,
                'data_geracao': timezone.now().isoformat(),
                'total_registros': len(dados),
                'dados': dados
            }
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(json.dumps(json_data, indent=2, ensure_ascii=False).encode('utf-8'))
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(content.read())
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação JSON: {e}")
            raise
    
    def _exportar_html(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em HTML"""
        try:
            # Criar HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{titulo}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    table {{ border-collapse: collapse; width: 100%; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    tr:nth-child(even) {{ background-color: #f9f9f9; }}
                    h1 {{ color: #333; }}
                </style>
            </head>
            <body>
                <h1>{titulo}</h1>
                <p>Gerado em: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                <p>Total de registros: {len(dados)}</p>
                <table>
            """
            
            if dados:
                # Cabeçalhos
                headers = list(dados[0].keys())
                html_content += "<tr>"
                for header in headers:
                    html_content += f"<th>{header}</th>"
                html_content += "</tr>"
                
                # Dados
                for row in dados:
                    html_content += "<tr>"
                    for header in headers:
                        html_content += f"<td>{row.get(header, '')}</td>"
                    html_content += "</tr>"
            
            html_content += """
                </table>
            </body>
            </html>
            """
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.html"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(html_content.encode('utf-8'))
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(html_content.encode('utf-8'))
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação HTML: {e}")
            raise
    
    def _exportar_xml(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Exporta dados em XML"""
        try:
            # Criar XML
            xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<relatorio>
    <titulo>{titulo}</titulo>
    <data_geracao>{timezone.now().isoformat()}</data_geracao>
    <total_registros>{len(dados)}</total_registros>
    <dados>
"""
            
            for row in dados:
                xml_content += "        <registro>\n"
                for key, value in row.items():
                    xml_content += f"            <{key}>{value}</{key}>\n"
                xml_content += "        </registro>\n"
            
            xml_content += """    </dados>
</relatorio>"""
            
            # Salvar arquivo
            filename = f"{titulo.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xml"
            file_path = f"relatorios/{filename}"
            
            content = ContentFile(xml_content.encode('utf-8'))
            default_storage.save(file_path, content)
            
            return {
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(xml_content.encode('utf-8'))
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação XML: {e}")
            raise
    
    def _adicionar_graficos_excel(self, writer, df: pd.DataFrame) -> None:
        """Adiciona gráficos ao arquivo Excel"""
        try:
            # Identificar colunas numéricas
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            
            if len(numeric_columns) > 0:
                # Criar gráfico de barras para a primeira coluna numérica
                fig, ax = plt.subplots(figsize=(10, 6))
                df[numeric_columns[0]].plot(kind='bar', ax=ax)
                ax.set_title(f'Distribuição de {numeric_columns[0]}')
                ax.set_xlabel('Registros')
                ax.set_ylabel(numeric_columns[0])
                
                # Salvar gráfico
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', bbox_inches='tight')
                img_buffer.seek(0)
                
                # Adicionar ao Excel
                worksheet = writer.sheets['Dados']
                worksheet.add_image(img_buffer, 'A1')
                
                plt.close()
                
        except Exception as e:
            logger.warning(f"Erro ao adicionar gráficos ao Excel: {e}")


class BIAvancadoService:
    """Serviço para integração com BI avançado"""
    
    def __init__(self):
        self.api_endpoints = {
            'powerbi': 'https://api.powerbi.com/v1.0/myorg',
            'tableau': 'https://api.tableau.com/v1',
            'qlik': 'https://api.qlik.com/v1'
        }
    
    def gerar_dashboard_interativo(self, dados: List[Dict], titulo: str) -> Dict[str, Any]:
        """Gera dashboard interativo com Plotly"""
        try:
            df = pd.DataFrame(dados)
            
            # Criar subplots
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=('Distribuição', 'Tendência Temporal', 'Correlação', 'Resumo'),
                specs=[[{"type": "bar"}, {"type": "scatter"}],
                       [{"type": "heatmap"}, {"type": "table"}]]
            )
            
            # Gráfico 1: Distribuição (primeira coluna numérica)
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            if len(numeric_columns) > 0:
                fig.add_trace(
                    go.Bar(x=df.index, y=df[numeric_columns[0]], name='Distribuição'),
                    row=1, col=1
                )
            
            # Gráfico 2: Tendência temporal (se houver data)
            date_columns = df.select_dtypes(include=['datetime64']).columns
            if len(date_columns) > 0 and len(numeric_columns) > 0:
                fig.add_trace(
                    go.Scatter(x=df[date_columns[0]], y=df[numeric_columns[0]], 
                              mode='lines+markers', name='Tendência'),
                    row=1, col=2
                )
            
            # Gráfico 3: Correlação (matriz de correlação)
            if len(numeric_columns) > 1:
                corr_matrix = df[numeric_columns].corr()
                fig.add_trace(
                    go.Heatmap(z=corr_matrix.values, x=corr_matrix.columns, 
                              y=corr_matrix.columns, colorscale='RdBu'),
                    row=2, col=1
                )
            
            # Gráfico 4: Tabela de resumo
            if len(dados) > 0:
                headers = list(dados[0].keys())
                fig.add_trace(
                    go.Table(
                        header=dict(values=headers),
                        cells=dict(values=[[row.get(header, '') for header in headers] 
                                         for row in dados[:10]])  # Primeiros 10 registros
                    ),
                    row=2, col=2
                )
            
            # Atualizar layout
            fig.update_layout(
                title=titulo,
                height=800,
                showlegend=True
            )
            
            # Salvar como HTML interativo
            filename = f"{titulo.replace(' ', '_')}_dashboard_{timezone.now().strftime('%Y%m%d_%H%M%S')}.html"
            file_path = f"relatorios/dashboards/{filename}"
            
            html_content = fig.to_html(include_plotlyjs=True, full_html=True)
            content = ContentFile(html_content.encode('utf-8'))
            default_storage.save(file_path, content)
            
            return {
                'sucesso': True,
                'arquivo': file_path,
                'nome_arquivo': filename,
                'tamanho': len(html_content.encode('utf-8')),
                'tipo': 'dashboard_interativo'
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar dashboard: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def integrar_powerbi(self, dados: List[Dict], dataset_name: str) -> Dict[str, Any]:
        """Integra dados com Power BI (simulado)"""
        try:
            # Simulação de integração com Power BI
            # Em produção, seria integração real com API do Power BI
            
            return {
                'sucesso': True,
                'dataset_id': f"dataset_{uuid.uuid4().hex[:8]}",
                'dataset_name': dataset_name,
                'registros_enviados': len(dados),
                'status': 'sincronizado',
                'url_dashboard': f"https://app.powerbi.com/dashboard/{uuid.uuid4().hex[:8]}"
            }
            
        except Exception as e:
            logger.error(f"Erro na integração Power BI: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def gerar_kpis_avancados(self, dados: List[Dict]) -> Dict[str, Any]:
        """Gera KPIs avançados dos dados"""
        try:
            df = pd.DataFrame(dados)
            
            kpis = {
                'total_registros': len(df),
                'periodo_analise': {
                    'inicio': df.index.min() if len(df) > 0 else None,
                    'fim': df.index.max() if len(df) > 0 else None
                }
            }
            
            # KPIs numéricos
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            for col in numeric_columns:
                kpis[f'{col}_stats'] = {
                    'media': float(df[col].mean()),
                    'mediana': float(df[col].median()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max()),
                    'desvio_padrao': float(df[col].std()),
                    'soma': float(df[col].sum())
                }
            
            # KPIs de tendência
            if len(df) > 1:
                for col in numeric_columns:
                    # Calcular tendência (crescimento/decrescimento)
                    valores = df[col].values
                    if len(valores) > 1:
                        tendencia = (valores[-1] - valores[0]) / valores[0] * 100
                        kpis[f'{col}_tendencia'] = {
                            'percentual': float(tendencia),
                            'direcao': 'crescimento' if tendencia > 0 else 'decrescimento'
                        }
            
            # KPIs de distribuição
            categorical_columns = df.select_dtypes(include=['object']).columns
            for col in categorical_columns:
                if df[col].nunique() <= 20:  # Limitar para colunas com poucos valores únicos
                    kpis[f'{col}_distribuicao'] = df[col].value_counts().to_dict()
            
            return {
                'sucesso': True,
                'kpis': kpis,
                'gerado_em': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar KPIs: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }


class WorkflowRelatoriosService:
    """Serviço para gerenciar workflow completo de relatórios"""
    
    def __init__(self):
        self.exportacao_service = ExportacaoEspecificaService()
        self.bi_service = BIAvancadoService()
    
    def processar_relatorio_completo(self, relatorio: Relatorio) -> Dict[str, Any]:
        """Processa relatório completo com exportação e BI"""
        try:
            # 1. Determinar tipo de relatório
            tipo_relatorio = relatorio.tipo_relatorio.nome.lower()
            
            # 2. Exportar dados específicos
            if 'fiscalizacao' in tipo_relatorio:
                resultado_exportacao = self.exportacao_service.exportar_relatorio_fiscalizacao(relatorio)
            elif 'multas' in tipo_relatorio:
                resultado_exportacao = self.exportacao_service.exportar_relatorio_multas(relatorio)
            elif 'juridico' in tipo_relatorio:
                resultado_exportacao = self.exportacao_service.exportar_relatorio_juridico(relatorio)
            else:
                # Relatório genérico
                resultado_exportacao = self._exportar_relatorio_generico(relatorio)
            
            if not resultado_exportacao['sucesso']:
                return resultado_exportacao
            
            # 3. Gerar dashboard interativo
            resultado_dashboard = self.bi_service.gerar_dashboard_interativo(
                resultado_exportacao.get('dados', []),
                relatorio.titulo
            )
            
            # 4. Gerar KPIs avançados
            resultado_kpis = self.bi_service.gerar_kpis_avancados(
                resultado_exportacao.get('dados', [])
            )
            
            # 5. Atualizar relatório
            relatorio.status = 'CONCLUIDO'
            relatorio.data_conclusao = timezone.now()
            relatorio.arquivo = resultado_exportacao['arquivo']
            relatorio.nome_arquivo = resultado_exportacao['nome_arquivo']
            relatorio.tamanho_arquivo = resultado_exportacao['tamanho']
            relatorio.registros_processados = resultado_exportacao['registros_processados']
            relatorio.save()
            
            return {
                'sucesso': True,
                'relatorio_id': relatorio.id,
                'exportacao': resultado_exportacao,
                'dashboard': resultado_dashboard,
                'kpis': resultado_kpis
            }
            
        except Exception as e:
            logger.error(f"Erro no processamento do relatório: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def _exportar_relatorio_generico(self, relatorio: Relatorio) -> Dict[str, Any]:
        """Exporta relatório genérico"""
        try:
            # Buscar dados genéricos baseados nos parâmetros
            parametros = relatorio.parametros
            
            # Simular dados genéricos
            dados = [
                {'id': i, 'valor': i * 10, 'categoria': f'Cat {i % 5}', 'data': timezone.now().isoformat()}
                for i in range(100)
            ]
            
            # Exportar no formato solicitado
            resultado = self.exportacao_service._exportar_dados(dados, relatorio.formato, relatorio.titulo)
            
            return {
                'sucesso': True,
                'arquivo': resultado['arquivo'],
                'registros_processados': len(dados),
                'total_registros': len(dados),
                'formato': relatorio.formato,
                'dados': dados
            }
            
        except Exception as e:
            logger.error(f"Erro na exportação genérica: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }


# Instâncias globais dos serviços
exportacao_service = ExportacaoEspecificaService()
bi_service = BIAvancadoService()
workflow_service = WorkflowRelatoriosService()
