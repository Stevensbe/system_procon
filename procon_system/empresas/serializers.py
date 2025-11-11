from rest_framework import serializers


class EmpresaResumoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    razao_social = serializers.CharField()
    cnpj = serializers.CharField()
    situacao = serializers.CharField()
    classificacao_risco = serializers.CharField()


class EmpresasDashboardSerializer(serializers.Serializer):
    total_empresas = serializers.IntegerField()
    empresas_por_situacao = serializers.DictField(child=serializers.IntegerField())
    empresas_recentes = EmpresaResumoSerializer(many=True)
