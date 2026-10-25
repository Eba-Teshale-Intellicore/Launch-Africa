
from rest_framework import serializers

from products.models.productimage import ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "product",
            "public_id",
            "secure_url",
            "alt_text",
            "display_order",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "product",
            "public_id",
            "secure_url",
            "display_order",
            "is_primary",
            "created_at",
            "updated_at",
        ]

    def validate_alt_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "Please provide descriptive alternative text."
            )
        return value
