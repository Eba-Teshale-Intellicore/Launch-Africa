# accounts/serializers/profile.py

from rest_framework import serializers
from accounts.models.profile import Profile

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "display_name",
            "bio",
            "avatar_public_id",
            "avatar_url",
            "country",
            "city",
            "website_url",
            "github_url",
            "linkedin_url",
            "x_url",
            "youtube_url",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "avatar_public_id",
            "avatar_url",
            "created_at",
            "updated_at",
        ]