import re
from rest_framework import serializers
from categories.models.categories import Category


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(
        read_only=True,
        default=0,
    )
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon_name",
            "is_active",
            "display_order",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "product_count",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        # Normalize leading, trailing, and repeated whitespace.
        value = re.sub(r"\s+", " ", value).strip()
        if not value:
            raise serializers.ValidationError(
                "Category name is required."
            )
        queryset = Category.objects.filter(
            name__iexact=value
        )
        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )
        return value
