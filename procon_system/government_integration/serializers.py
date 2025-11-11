from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import IntegrationConnector, IntegrationSyncRun, IntegrationEvent

User = get_user_model()


class IntegrationConnectorSerializer(serializers.ModelSerializer):
    criado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = IntegrationConnector
        fields = "__all__"


class IntegrationSyncRunSerializer(serializers.ModelSerializer):
    responsavel = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = IntegrationSyncRun
        fields = "__all__"
        read_only_fields = ["iniciado_em", "finalizado_em"]


class IntegrationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationEvent
        fields = "__all__"
        read_only_fields = ["recebido_em", "processado_em"]

