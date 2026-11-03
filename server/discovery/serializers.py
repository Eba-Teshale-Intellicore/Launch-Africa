
from django.contrib.auth import get_user_model
from rest_framework import serializers

from categories.models.categories import Category
from products.models.products import Products


class ProductSearchSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    category_slug = serializers.CharField(
        source="category.slug",
        read_only=True,
    )

    class Meta:
        model = Products
        fields = [
            "id",
            "title",
            "slug",
            "tagline",
            "logo_url",
            "category_name",
            "category_slug",
        ]


class CategorySearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon_name",
        ]


class BuilderSearchSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "display_name",
            "avatar_url",
            "bio",
        ]

    def get_display_name(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.display_name if profile else ""

    def get_avatar_url(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.avatar_url or None if profile else None

    def get_bio(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.bio if profile else ""
