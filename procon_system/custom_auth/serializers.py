from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from core.roles import (
    get_empresas,
    get_primary_role,
    get_redirect_for_role,
    get_user_roles,
)

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer enriquecido para perfil do usuario com papeis e permissoes."""

    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    empresas = serializers.SerializerMethodField()
    has_portal_empresa = serializers.SerializerMethodField()
    has_portal_consumidor = serializers.SerializerMethodField()
    redirect_to = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "role",
            "roles",
            "permissions",
            "empresas",
            "has_portal_empresa",
            "has_portal_consumidor",
            "redirect_to",
        ]
        read_only_fields = [
            "id",
            "username",
            "full_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "role",
            "roles",
            "permissions",
            "empresas",
            "has_portal_empresa",
            "has_portal_consumidor",
            "redirect_to",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        return get_primary_role(obj)

    def get_roles(self, obj):
        return get_user_roles(obj)

    def get_permissions(self, obj):
        return sorted(list(obj.get_all_permissions()))

    def get_empresas(self, obj):
        return get_empresas(obj)

    def get_has_portal_empresa(self, obj):
        return any(role in ("admin", "staff", "empresa") for role in get_user_roles(obj))

    def get_has_portal_consumidor(self, obj):
        return any(role in ("admin", "staff", "consumer") for role in get_user_roles(obj))

    def get_redirect_to(self, obj):
        return get_redirect_for_role(obj)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("As senhas nao coincidem")
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer JWT que inclui informacoes de perfil e papeis no payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = get_primary_role(user)
        token["roles"] = get_user_roles(user)
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserProfileSerializer(self.user, context=self.context).data

        data["user"] = user_data
        data["role"] = user_data.get("role")
        data["redirect_to"] = user_data.get("redirect_to")
        return data
