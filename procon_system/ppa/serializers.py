from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ProcedimentoPreAdministrativo,
    MovimentacaoPPA,
    AnexoPPA,
    ParecerPPA
)


class UserSimpleSerializer(serializers.ModelSerializer):
    """Serializer simples para usuário"""
    nome_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'nome_completo', 'email']
    
    def get_nome_completo(self, obj):
        return obj.get_full_name() or obj.username


class MovimentacaoPPASerializer(serializers.ModelSerializer):
    """Serializer para movimentações do PPA"""
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_movimentacao_display = serializers.CharField(source='get_tipo_movimentacao_display', read_only=True)
    
    class Meta:
        model = MovimentacaoPPA
        fields = [
            'id',
            'ppa',
            'data',
            'hora',
            'tipo_movimentacao',
            'tipo_movimentacao_display',
            'atendimento',
            'usuario',
            'usuario_nome',
            'criado_em',
        ]
        read_only_fields = ['criado_em', 'ppa']


class AnexoPPASerializer(serializers.ModelSerializer):
    """Serializer para anexos do PPA"""
    anexado_por_nome = serializers.CharField(source='anexado_por.get_full_name', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    tamanho_arquivo_display = serializers.CharField(source='tamanho_arquivo', read_only=True)
    
    class Meta:
        model = AnexoPPA
        fields = [
            'id',
            'ppa',
            'tipo_documento',
            'tipo_documento_display',
            'numero_documento',
            'descricao',
            'arquivo',
            'nome_arquivo_original',
            'tamanho_arquivo_display',
            'content_type',
            'object_id',
            'anexado_por',
            'anexado_por_nome',
            'data_anexacao',
        ]
        read_only_fields = ['data_anexacao', 'tamanho_arquivo_display']


class ParecerPPASerializer(serializers.ModelSerializer):
    """Serializer para pareceres do PPA"""
    elaborado_por_nome = serializers.CharField(source='elaborado_por.get_full_name', read_only=True)
    aprovado_por_nome = serializers.CharField(source='aprovado_por.get_full_name', read_only=True)
    conclusao_display = serializers.CharField(source='get_conclusao_display', read_only=True)
    
    class Meta:
        model = ParecerPPA
        fields = [
            'id',
            'ppa',
            'numero_parecer',
            'titulo',
            'relatorio',
            'fundamentacao',
            'conclusao',
            'conclusao_display',
            'recomendacoes',
            'elaborado_por',
            'elaborado_por_nome',
            'cargo_elaborador',
            'aprovado_por',
            'aprovado_por_nome',
            'data_aprovacao',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = ['numero_parecer', 'criado_em', 'atualizado_em']


class ProcedimentoPreAdministrativoListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem de PPAs"""
    analista_nome = serializers.CharField(source='analista_responsavel.get_full_name', read_only=True)
    supervisor_nome = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    decisao_final_display = serializers.CharField(source='get_decisao_final_display', read_only=True)
    sigla_display = serializers.CharField(source='get_sigla_display', read_only=True)
    
    class Meta:
        model = ProcedimentoPreAdministrativo
        fields = [
            'id',
            'uuid',
            'numero',
            'sigla',
            'sigla_display',
            'assunto',
            'interessado',
            'cnpj_interessado',
            'status',
            'status_display',
            'decisao_final',
            'decisao_final_display',
            'analista_responsavel',
            'analista_nome',
            'supervisor',
            'supervisor_nome',
            'prazo_analise',
            'prazo_resposta',
            'esta_no_prazo',
            'dias_ate_prazo',
            'total_anexos',
            'total_movimentacoes',
            'criado_em',
            'atualizado_em',
        ]


class ProcedimentoPreAdministrativoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes do PPA"""
    analista_responsavel_dados = UserSimpleSerializer(source='analista_responsavel', read_only=True)
    supervisor_dados = UserSimpleSerializer(source='supervisor', read_only=True)
    criado_por_dados = UserSimpleSerializer(source='criado_por', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    decisao_final_display = serializers.CharField(source='get_decisao_final_display', read_only=True)
    sigla_display = serializers.CharField(source='get_sigla_display', read_only=True)
    
    movimentacoes = MovimentacaoPPASerializer(many=True, read_only=True)
    anexos = AnexoPPASerializer(many=True, read_only=True)
    pareceres = ParecerPPASerializer(many=True, read_only=True)
    
    class Meta:
        model = ProcedimentoPreAdministrativo
        fields = [
            'id',
            'uuid',
            'numero',
            'sigla',
            'sigla_display',
            'assunto',
            'interessado',
            'cnpj_interessado',
            'endereco_interessado',
            'analista_responsavel',
            'analista_responsavel_dados',
            'supervisor',
            'supervisor_dados',
            'status',
            'status_display',
            'decisao_final',
            'decisao_final_display',
            'prazo_analise',
            'prazo_resposta',
            'data_conclusao',
            'observacoes',
            'observacoes_internas',
            'fundamentacao_decisao',
            'esta_no_prazo',
            'dias_ate_prazo',
            'total_anexos',
            'total_movimentacoes',
            'criado_em',
            'atualizado_em',
            'criado_por',
            'criado_por_dados',
            'movimentacoes',
            'anexos',
            'pareceres',
        ]
        read_only_fields = [
            'numero',
            'uuid',
            'criado_em',
            'atualizado_em',
            'esta_no_prazo',
            'dias_ate_prazo',
            'total_anexos',
            'total_movimentacoes',
        ]


class ProcedimentoPreAdministrativoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de PPA"""
    
    class Meta:
        model = ProcedimentoPreAdministrativo
        fields = [
            'sigla',
            'assunto',
            'interessado',
            'cnpj_interessado',
            'endereco_interessado',
            'analista_responsavel',
            'supervisor',
            'status',
            'prazo_analise',
            'prazo_resposta',
            'observacoes',
            'observacoes_internas',
        ]
    
    def create(self, validated_data):
        """Cria PPA e registra primeira movimentação"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['criado_por'] = request.user
            if 'analista_responsavel' not in validated_data:
                validated_data['analista_responsavel'] = request.user
        
        ppa = super().create(validated_data)
        
        # Registra movimentação de criação
        MovimentacaoPPA.objects.create(
            ppa=ppa,
            tipo_movimentacao='criacao',
            atendimento=f"PPA {ppa.numero} criado",
            usuario=request.user if request and hasattr(request, 'user') else None
        )
        
        return ppa


class ProcedimentoPreAdministrativoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de PPA"""
    
    class Meta:
        model = ProcedimentoPreAdministrativo
        fields = [
            'sigla',
            'assunto',
            'interessado',
            'cnpj_interessado',
            'endereco_interessado',
            'analista_responsavel',
            'supervisor',
            'status',
            'decisao_final',
            'prazo_analise',
            'prazo_resposta',
            'data_conclusao',
            'observacoes',
            'observacoes_internas',
            'fundamentacao_decisao',
        ]
    
    def update(self, instance, validated_data):
        """Atualiza PPA e registra movimentação se status mudar"""
        status_anterior = instance.status
        decisao_anterior = instance.decisao_final
        
        ppa = super().update(instance, validated_data)
        
        request = self.context.get('request')
        usuario = request.user if request and hasattr(request, 'user') else None
        
        # Registra movimentação se status mudou
        if status_anterior != ppa.status:
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='mudanca_status',
                atendimento=f"Status alterado de '{status_anterior}' para '{ppa.status}'",
                usuario=usuario
            )
        
        # Registra movimentação se decisão mudou
        if decisao_anterior != ppa.decisao_final and ppa.decisao_final != 'pendente':
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='decisao',
                atendimento=f"Decisão final: {ppa.get_decisao_final_display()}",
                usuario=usuario
            )
        
        return ppa

