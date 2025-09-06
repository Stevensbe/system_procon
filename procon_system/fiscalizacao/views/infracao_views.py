"""
Views para Autos de Infração - System Procon

Este módulo contém as views relacionadas aos Autos de Infração,
incluindo criação, listagem, atualização de status e relacionamentos com Autos de Constatação.
"""

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.contrib.contenttypes.models import ContentType
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, timedelta

from ..models import (
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
    AutoInfracao,
    HistoricoStatusInfracao,
    STATUS_INFRACAO_CHOICES,
)

from ..serializers import (
    AutoInfracaoSerializer,
    AutoInfracaoCreateSerializer,
    AutoInfracaoSimpleSerializer,
)


# ========================================
# VIEWS DE API - AUTO INFRAÇÃO
# ========================================

class AutoInfracaoListCreateAPIView(generics.ListCreateAPIView):
    queryset = AutoInfracao.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AutoInfracaoCreateSerializer
        return AutoInfracaoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros específicos
        status_filter = self.request.query_params.get('status')
        razao_social = self.request.query_params.get('razao_social')
        cnpj = self.request.query_params.get('cnpj')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if razao_social:
            queryset = queryset.filter(razao_social__icontains=razao_social)
        if cnpj:
            queryset = queryset.filter(cnpj__icontains=cnpj)
        if data_inicio:
            queryset = queryset.filter(data_fiscalizacao__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_fiscalizacao__lte=data_fim)
        
        return queryset


class AutoInfracaoRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AutoInfracao.objects.all()
    serializer_class = AutoInfracaoSerializer


@api_view(['GET'])
def gerar_documento_infracao_docx(request, pk):
    """
    Gera documento DOCX do Auto de Infração
    """
    try:
        auto = AutoInfracao.objects.get(pk=pk)
    except AutoInfracao.DoesNotExist:
        return Response({'error': 'Auto de Infração não encontrado'}, status=404)
    
    try:
        from django.http import HttpResponse
        from django.template.loader import get_template
        import os
        from docx import Document
        from docx.shared import Inches
        from io import BytesIO
        import locale
        
        # Configura locale para português
        try:
            locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
        except:
            pass
        
        # Cria o documento
        doc = Document()
        
        # Cabeçalho
        header = doc.sections[0].header
        header_para = header.paragraphs[0]
        header_para.text = "GOVERNO DO ESTADO DO AMAZONAS\nInstituto de Defesa do Consumidor\nPROCON-AM"
        
        # Título
        title = doc.add_heading(f'AUTO DE INFRAÇÃO Nº {auto.numero}', 0)
        title.alignment = 1  # Centralizado
        
        # Dados básicos
        doc.add_heading('DADOS DO ESTABELECIMENTO', level=1)
        
        p = doc.add_paragraph()
        p.add_run('RAZÃO SOCIAL: ').bold = True
        p.add_run(auto.razao_social or '')
        
        if auto.nome_fantasia:
            p = doc.add_paragraph()
            p.add_run('NOME FANTASIA: ').bold = True
            p.add_run(auto.nome_fantasia)
        
        p = doc.add_paragraph()
        p.add_run('ATIVIDADE: ').bold = True
        p.add_run(auto.atividade or '')
        
        p = doc.add_paragraph()
        p.add_run('ENDEREÇO: ').bold = True
        p.add_run(auto.endereco or '')
        
        p = doc.add_paragraph()
        p.add_run('CNPJ: ').bold = True
        p.add_run(auto.cnpj or '')
        
        if auto.telefone:
            p = doc.add_paragraph()
            p.add_run('TELEFONE: ').bold = True
            p.add_run(auto.telefone)
        
        # Data e local
        doc.add_heading('FISCALIZAÇÃO', level=1)
        
        p = doc.add_paragraph()
        p.add_run('MUNICÍPIO: ').bold = True
        p.add_run(f"{auto.municipio}, {auto.estado}")
        
        p = doc.add_paragraph()
        p.add_run('DATA: ').bold = True
        p.add_run(auto.data_fiscalizacao.strftime('%d/%m/%Y'))
        
        p = doc.add_paragraph()
        p.add_run('HORA: ').bold = True
        p.add_run(auto.hora_fiscalizacao.strftime('%H:%M'))
        
        # Parecer prévio
        if auto.parecer_numero:
            doc.add_heading('PARECER PRÉVIO', level=1)
            p = doc.add_paragraph()
            p.add_run('NÚMERO: ').bold = True
            p.add_run(auto.parecer_numero)
            
            p = doc.add_paragraph()
            p.add_run('ORIGEM: ').bold = True
            p.add_run(auto.parecer_origem)
        
        # Relatório
        doc.add_heading('RELATÓRIO', level=1)
        doc.add_paragraph(auto.relatorio or '')
        
        # Base legal
        doc.add_heading('BASE LEGAL', level=1)
        if auto.base_legal_cdc:
            p = doc.add_paragraph()
            p.add_run('CDC: ').bold = True
            p.add_run(auto.base_legal_cdc)
        
        if auto.base_legal_outras:
            p = doc.add_paragraph()
            p.add_run('OUTRAS BASES LEGAIS: ').bold = True
            p.add_run(auto.base_legal_outras)
        
        # Infrações
        doc.add_heading('INFRAÇÕES CONSTATADAS', level=1)
        
        infracoes = []
        if auto.infracao_art_34:
            infracoes.append("Art. 34 do CDC")
        if auto.infracao_art_35:
            infracoes.append("Art. 35 do CDC")
        if auto.infracao_art_36:
            infracoes.append("Art. 36 do CDC")
        if auto.infracao_art_55:
            infracoes.append("Art. 55 do CDC")
        if auto.infracao_art_56:
            infracoes.append("Art. 56 do CDC")
        if auto.infracao_publicidade_enganosa:
            infracoes.append("Publicidade Enganosa")
        if auto.infracao_precos_abusivos:
            infracoes.append("Preços Abusivos")
        if auto.infracao_produtos_vencidos:
            infracoes.append("Produtos Vencidos")
        if auto.infracao_falta_informacao:
            infracoes.append("Falta de Informação")
        
        for infracao in infracoes:
            doc.add_paragraph(f"• {infracao}", style='List Bullet')
        
        if auto.outras_infracoes:
            p = doc.add_paragraph()
            p.add_run('OUTRAS INFRAÇÕES: ').bold = True
            p.add_run(auto.outras_infracoes)
        
        # Valor da multa
        doc.add_heading('PENALIDADE', level=1)
        p = doc.add_paragraph()
        p.add_run('VALOR DA MULTA: ').bold = True
        p.add_run(auto.valor_multa_formatado)
        
        # Responsáveis
        doc.add_heading('RESPONSÁVEIS', level=1)
        
        p = doc.add_paragraph()
        p.add_run('AUTORIDADE FISCALIZADORA: ').bold = True
        p.add_run(f"{auto.fiscal_nome} - {auto.fiscal_cargo}")
        
        p = doc.add_paragraph()
        p.add_run('ESTABELECIMENTO FISCALIZADO: ').bold = True
        p.add_run(f"{auto.responsavel_nome} - CPF: {auto.responsavel_cpf}")
        
        # Salva em buffer
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        # Retorna como download
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="Auto_Infracao_{auto.numero.replace("/", "_")}.docx"'
        
        return response
        
    except Exception as e:
        return Response({'error': f'Erro ao gerar documento: {str(e)}'}, status=500)


# ========================================
# VIEWS FUNCIONAIS PARA INFRAÇÕES
# ========================================

@api_view(['POST'])
def criar_infracao_de_auto(request):
    """
    Cria uma infração baseada em um auto de constatação existente.
    
    Espera:
    - auto_tipo: 'banco', 'posto', 'supermercado', 'diversos'
    - auto_id: ID do auto
    - dados da infração
    """
    try:
        auto_tipo = request.data.get('auto_tipo')
        auto_id = request.data.get('auto_id')
        
        # Mapear tipos para modelos
        model_map = {
            'banco': AutoBanco,
            'posto': AutoPosto,
            'supermercado': AutoSupermercado,
            'diversos': AutoDiversos,
        }
        
        if auto_tipo not in model_map:
            return Response(
                {'error': 'Tipo de auto inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar o auto
        model_class = model_map[auto_tipo]
        auto_obj = get_object_or_404(model_class, id=auto_id)
        
        # Obter ContentType
        content_type = ContentType.objects.get_for_model(model_class)
        
        # Criar dados da infração
        infracao_data = request.data.copy()
        infracao_data['content_type'] = content_type.id
        infracao_data['object_id'] = auto_id
        
        # Pré-preencher alguns campos do auto
        infracao_data['data_fiscalizacao'] = auto_obj.data_fiscalizacao
        infracao_data['hora_fiscalizacao'] = auto_obj.hora_fiscalizacao
        
        # Usar serializer para criar
        serializer = AutoInfracaoCreateSerializer(data=infracao_data)
        if serializer.is_valid():
            infracao = serializer.save()
            return Response(
                AutoInfracaoSerializer(infracao).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def infrações_por_auto(request, auto_tipo, auto_id):
    """
    Lista infrações relacionadas a um auto específico.
    """
    try:
        # Mapear tipos para modelos
        model_map = {
            'banco': AutoBanco,
            'posto': AutoPosto,
            'supermercado': AutoSupermercado,
            'diversos': AutoDiversos,
        }
        
        if auto_tipo not in model_map:
            return Response(
                {'error': 'Tipo de auto inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        model_class = model_map[auto_tipo]
        content_type = ContentType.objects.get_for_model(model_class)
        
        # Buscar infrações
        infracoes = AutoInfracao.objects.filter(
            content_type=content_type,
            object_id=auto_id
        ).order_by('-data_fiscalizacao')
        
        serializer = AutoInfracaoSimpleSerializer(infracoes, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def autos_com_potencial_infracao(request):
    """
    Lista autos que têm irregularidades mas ainda não têm infração criada.
    """
    try:
        resultado = []
        
        # AutoBanco com irregularidades
        bancos_irregulares = AutoBanco.objects.exclude(
            Q(nada_consta=True) | Q(sem_irregularidades=True)
        ).exclude(
            # Excluir os que já têm infração
            id__in=AutoInfracao.objects.filter(
                content_type=ContentType.objects.get_for_model(AutoBanco)
            ).values_list('object_id', flat=True)
        )
        
        for banco in bancos_irregulares:
            resultado.append({
                'tipo': 'banco',
                'id': banco.id,
                'numero': banco.numero,
                'razao_social': banco.razao_social,
                'data_fiscalizacao': banco.data_fiscalizacao,
                'irregularidades': 'Diversas irregularidades bancárias'
            })
        
        # AutoPosto com irregularidades
        postos_irregulares = AutoPosto.objects.exclude(
            Q(nada_consta=True) | Q(sem_irregularidades=True)
        ).exclude(
            id__in=AutoInfracao.objects.filter(
                content_type=ContentType.objects.get_for_model(AutoPosto)
            ).values_list('object_id', flat=True)
        )
        
        for posto in postos_irregulares:
            resultado.append({
                'tipo': 'posto',
                'id': posto.id,
                'numero': posto.numero,
                'razao_social': posto.razao_social,
                'data_fiscalizacao': posto.data_fiscalizacao,
                'irregularidades': 'Irregularidades em posto de combustível'
            })
        
        # AutoSupermercado com irregularidades
        supermercados_irregulares = AutoSupermercado.objects.exclude(
            nada_consta=True
        ).exclude(
            id__in=AutoInfracao.objects.filter(
                content_type=ContentType.objects.get_for_model(AutoSupermercado)
            ).values_list('object_id', flat=True)
        )
        
        for supermercado in supermercados_irregulares:
            resultado.append({
                'tipo': 'supermercado',
                'id': supermercado.id,
                'numero': supermercado.numero,
                'razao_social': supermercado.razao_social,
                'data_fiscalizacao': supermercado.data_fiscalizacao,
                'irregularidades': 'Irregularidades em supermercado'
            })
        
        # Ordenar por data mais recente
        resultado.sort(key=lambda x: x['data_fiscalizacao'], reverse=True)
        
        return Response(resultado)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def atualizar_status_infracao(request, pk):
    """
    Atualiza o status de uma infração e registra no histórico.
    """
    try:
        infracao = get_object_or_404(AutoInfracao, pk=pk)
        novo_status = request.data.get('status')
        observacoes = request.data.get('observacoes', '')
        usuario = request.data.get('usuario', 'Sistema')
        
        if novo_status not in [choice[0] for choice in STATUS_INFRACAO_CHOICES]:
            return Response(
                {'error': 'Status inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        status_anterior = infracao.status
        infracao.status = novo_status
        infracao.save()
        
        # Registrar no histórico
        HistoricoStatusInfracao.objects.create(
            auto_infracao=infracao,
            status_anterior=status_anterior,
            status_novo=novo_status,
            observacoes=observacoes,
            usuario=usuario
        )
        
        return Response({
            'message': 'Status atualizado com sucesso',
            'status_anterior': status_anterior,
            'status_novo': novo_status
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
