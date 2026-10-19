from rest_framework import serializers
from accounts.models.user import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            # "auth_provider",
            # "role",
            # "is_verified",
            # "created_at",
            # "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            # "auth_provider",
            # "role",
            # "is_verified",
            # "created_at",
            # "updated_at",
        ]

    def validate_username(self, value):
        value = value.strip().lower()

        queryset = User.objects.filter(username__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        if not value:
            raise serializers.ValidationError(
                "A username is required."
            )

        return value