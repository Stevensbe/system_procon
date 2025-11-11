from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    KPI,
    Dashboard,
    DashboardKPI,
    ValorKPI,
    RelatorioPersonalizado,
    HistoricoRelatorio,
    AnaliseEmpirica,
)

User = get_user_model()


class KPISerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = KPI
        fields = "__all__"


class DashboardKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardKPI
        fields = "__all__"


class DashboardSerializer(serializers.ModelSerializer):
    dashboard_kpis = DashboardKPISerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = "__all__"


class ValorKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = ValorKPI
        fields = "__all__"
        read_only_fields = [
            "calculado_em",
        ]


class RelatorioPersonalizadoSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = RelatorioPersonalizado
        fields = "__all__"


class HistoricoRelatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoRelatorio
        fields = "__all__"
        read_only_fields = ["executado_em"]


class AnaliseEmpiricaSerializer(serializers.ModelSerializer):
    executado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AnaliseEmpirica
        fields = "__all__"

