
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from categories.models.categories import Category
from products.models.products import Products
from products.serializers.productimage import ProductImageSerializer


class CategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductsSerializer(serializers.ModelSerializer):
    categories = CategorySummarySerializer(
        many=True,
        read_only=True,
    )

    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        queryset=Category.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=False,
    )

    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    images = ProductImageSerializer(many=True, read_only=True)

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
            "categories",
            "category_ids",
            "status",
            "logo_public_id",
            "logo_url",
            "images",
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
            "images",
            "published_at",
            "created_at",
            "updated_at",
            "categories",
        ]

    def validate_category_ids(self, value):
        category_ids = [category.pk for category in value]

        if len(category_ids) != len(set(category_ids)):
            raise serializers.ValidationError(
                "Duplicate categories are not allowed."
            )

        return value

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

    def validate_website_url(self, value):
        if not value.lower().startswith("https://"):
            raise serializers.ValidationError(
                "The website URL must use HTTPS."
            )

        return value

    def validate_demo_url(self, value):
        if value and not value.lower().startswith("https://"):
            raise serializers.ValidationError(
                "The demo URL must use HTTPS."
            )

        return value

    def validate_country(self, value):
        value = value.strip()

        if len(value) > 30:
            raise serializers.ValidationError(
                "Country name must not exceed 30 characters."
            )

        return value

    def validate_languages(self, value):
        from products.models.products import validate_languages

        try:
            validate_languages(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return value

    def validate(self, attrs):
        selected_categories = attrs.get("categories")

        if selected_categories is None:
            if self.instance is not None:
                selected_categories = self.instance.categories.all()
            else:
                selected_categories = []

        if not selected_categories:
            raise serializers.ValidationError({
                "category_ids": "Choose at least one active category."
            })

        return attrs
