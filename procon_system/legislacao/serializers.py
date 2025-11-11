from rest_framework import serializers

from .models import Lei, Artigo


class ArtigoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artigo
        fields = ["id", "lei", "numero_artigo", "texto"]


class LeiSerializer(serializers.ModelSerializer):
    artigos = ArtigoSerializer(many=True, read_only=True)

    class Meta:
        model = Lei
        fields = [
            "id",
            "numero",
            "titulo",
            "publicada_em",
            "link",
            "observacoes",
            "artigos",
        ]

