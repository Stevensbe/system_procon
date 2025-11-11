from rest_framework import serializers

from .models import GeoDataLayer, GeoMetric, HeatmapSnapshot


class GeoDataLayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoDataLayer
        fields = "__all__"


class GeoMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoMetric
        fields = "__all__"
        read_only_fields = ["calculado_em"]


class HeatmapSnapshotSerializer(serializers.ModelSerializer):
    expirado = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = HeatmapSnapshot
        fields = "__all__"
        read_only_fields = ["gerado_em", "expirado"]

    def get_expirado(self, obj):
        return obj.expirado()

