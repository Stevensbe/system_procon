from rest_framework import serializers
from .models import (
    Multa, Empresa, Cobranca, Peticao, Recurso, 
    Analise, ConfigBancaria, ConfigSistema, Departamento
)
from fiscalizacao.models import AutoInfracao

# Serializer simples para AutoInfracao
class AutoInfracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutoInfracao
        fields = ['id', 'numero', 'data_fiscalizacao', 'razao_social', 'valor_multa', 'status']

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'

class MultaSerializer(serializers.ModelSerializer):
    processo_info = AutoInfracaoSerializer(source='processo', read_only=True)
    empresa_info = EmpresaSerializer(source='empresa', read_only=True)
    status_display = serializers.SerializerMethodField()
    esta_vencida = serializers.ReadOnlyField()
    dias_para_vencimento = serializers.ReadOnlyField()
    
    class Meta:
        model = Multa
        fields = [
            'id', 'processo', 'processo_info', 'empresa', 'empresa_info',
            'valor', 'data_emissao', 'data_vencimento', 'status',
            'status_display', 'comprovante_pagamento', 'observacoes',
            'esta_vencida', 'dias_para_vencimento', 'criado_em', 'atualizado_em',
            'pago'  # Campo legacy para compatibilidade
        ]
        read_only_fields = ['data_emissao', 'criado_em', 'atualizado_em', 'esta_vencida', 'dias_para_vencimento']
    
    def get_status_display(self, obj):
        status_choices = dict(Multa.STATUS_CHOICES)
        return status_choices.get(obj.status, obj.status)
    
    def validate(self, data):
        """Validações customizadas"""
        # Verifica se o processo está vinculado a uma empresa
        if 'processo' in data and 'empresa' in data:
            processo = data['processo']
            empresa = data['empresa']
            # Aqui poderia adicionar validação se processo.empresa == empresa
        
        return data

class CobrancaSerializer(serializers.ModelSerializer):
    multa_info = MultaSerializer(source='multa', read_only=True)
    
    class Meta:
        model = Cobranca
        fields = [
            'id', 'multa', 'multa_info', 'boleto', 'remessa', 'retorno',
            'data_vencimento', 'data_pagamento'
        ]

class PeticaoSerializer(serializers.ModelSerializer):
    processo_info = AutoInfracaoSerializer(source='processo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Peticao
        fields = [
            'id', 'processo', 'processo_info', 'tipo', 'tipo_display',
            'texto', 'documento', 'data'
        ]
        read_only_fields = ['data']

class RecursoSerializer(serializers.ModelSerializer):
    processo_info = AutoInfracaoSerializer(source='processo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Recurso
        fields = [
            'id', 'processo', 'processo_info', 'tipo', 'tipo_display',
            'texto', 'documento', 'data'
        ]
        read_only_fields = ['data']

class AnaliseSerializer(serializers.ModelSerializer):
    recurso_info = RecursoSerializer(source='recurso', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Analise
        fields = [
            'id', 'recurso', 'recurso_info', 'tipo', 'tipo_display',
            'parecer', 'decisao', 'data'
        ]
        read_only_fields = ['data']

class ConfigBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigBancaria
        fields = '__all__'

class ConfigSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigSistema
        fields = '__all__'
