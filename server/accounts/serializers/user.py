
import re

from rest_framework import serializers

from accounts.models.user import User


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "is_staff",
            "is_superuser",
            "is_active",
            "is_verified",
            "auth_provider",
            "avatar_url",
            "date_joined",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "role",
            "is_staff",
            "is_superuser",
            "is_active",
            "is_verified",
            "auth_provider",
            "avatar_url",
            "date_joined",
            "created_at",
            "updated_at",
        ]

    def get_avatar_url(self, obj):
        profile = getattr(obj, "profile", None)

        if not profile:
            return None

        return profile.avatar_url or None

    def validate_username(self, value):
        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError(
                "A username is required."
            )

        if not re.fullmatch(r"[a-z0-9_]+", value):
            raise serializers.ValidationError(
                "Use only letters, numbers, and underscores."
            )

        queryset = User.objects.filter(username__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value
