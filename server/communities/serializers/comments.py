from rest_framework import serializers

from communities.models.comments import Comments
from products.models.products import Products


class ProductsSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ["id", "title", "slug"]


class CommentsSerializers(serializers.ModelSerializer):
    product = ProductsSummarySerializer(read_only=True)
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comments
        fields = [
            "id",
            "product",
            "author",
            "body",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_body(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Comment cannot be empty or contain only whitespace."
            )
        if len(value) > 2000:
            raise serializers.ValidationError(
                "Comment cannot exceed 2,000 characters."
            )

        return value