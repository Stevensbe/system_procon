from __future__ import annotations

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .utils import serialize_user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Estende o serializer padrão para incluir dados completos do usuário,
    papéis e rota de redirecionamento.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = serialize_user(self.user)

        if user_data:
            data["user"] = user_data
            data["role"] = user_data.get("role")
            data["roles"] = user_data.get("roles")
            data["redirect_to"] = user_data.get("redirect_to")

        return data
