
from rest_framework import serializers

from categories.models.categories import Category
from products.models.products import Products
from products.serializers.productimage import ProductImageSerializer


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

    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    # Add the related product images to the response.
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
            "category",
            "category_id",
            "status",
            "logo_public_id",
            "logo_url",
            "images",  # Add this field.
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
        ]

    # Keep your existing validate_title, validate_tagline,
    # validate_description, URL, country, languages, and
    # validate methods below this point unchanged.


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
        # Reuse the model's validation rules through a field validator.
        from products.models.products import validate_languages

        try:
            validate_languages(value)
        except Exception as exc:
            from django.core.exceptions import ValidationError

            if isinstance(exc, ValidationError):
                raise serializers.ValidationError(exc.messages)
            raise

        return value

    def validate(self, attrs):
        category = attrs.get("category")

        if category is not None and not category.is_active:
            raise serializers.ValidationError({
                "category_id": "Choose an active category."
            })

        return attrs
