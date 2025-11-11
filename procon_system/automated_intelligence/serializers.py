from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AutomationRule, AutomationRun, InsightTrigger

User = get_user_model()


class AutomationRuleSerializer(serializers.ModelSerializer):
    criado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AutomationRule
        fields = "__all__"


class AutomationRunSerializer(serializers.ModelSerializer):
    executado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AutomationRun
        fields = "__all__"
        read_only_fields = ["disparado_em", "finalizado_em"]


class InsightTriggerSerializer(serializers.ModelSerializer):
    reconhecido_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = InsightTrigger
        fields = "__all__"
        read_only_fields = ["criado_em", "reconhecido_em"]

