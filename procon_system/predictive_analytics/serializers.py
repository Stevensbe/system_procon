from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import PredictiveModel, TrainingJob, ForecastResult

User = get_user_model()


class PredictiveModelSerializer(serializers.ModelSerializer):
    criado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = PredictiveModel
        fields = "__all__"


class TrainingJobSerializer(serializers.ModelSerializer):
    executado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = TrainingJob
        fields = "__all__"
        read_only_fields = ["iniciado_em", "finalizado_em", "duracao_segundos"]


class ForecastResultSerializer(serializers.ModelSerializer):
    gerado_por = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = ForecastResult
        fields = "__all__"
        read_only_fields = ["gerado_em"]

