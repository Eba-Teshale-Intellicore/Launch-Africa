from rest_framework import serializers

from categories.models.categories import Category
from products.models.products import Products


class CategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductsSerializer(serializers.ModelSerializer):
    category = CategorySummarySerializer(read_only=True)

    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.filter(is_active=True),
        write_only=True,
    )

    owner = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = Products

        fields = [
            "id",
            "owner",
            "title",
            "slug",
            "tagline",
            "description",
            "website_url",
            "demo_url",
            "category",
            "category_id",
            "status",
            "logo_public_id",
            "logo_url",
            "country",
            "languages",
            "published_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "slug",
            "status",
            "logo_public_id",
            "logo_url",
            "published_at",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Product title is required."
            )

        return value

    def validate_tagline(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Product tagline is required."
            )

        return value

    def validate_description(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Product description is required."
            )

        return value
