
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
        # Collapse repeated whitespace and remove outer whitespace.
        value = re.sub(r"\s+", " ", value).strip()

        if not value:
            raise serializers.ValidationError(
                "Category name is required."
            )

        if len(value) > 253:
            raise serializers.ValidationError(
                "Category name cannot exceed 253 characters."
            )

        queryset = Category.objects.filter(
            name__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )

        return value

    def validate_icon_name(self, value):
        value = value.strip()

        if len(value) > 30:
            raise serializers.ValidationError(
                "Icon name cannot exceed 30 characters."
            )

        return value

    def validate(self, attrs):
        # Categories must be reviewed before becoming public.
        # Reject an explicit activation request during creation
        # instead of silently ignoring the submitted value.
        if self.instance is None and attrs.get("is_active") is True:
            raise serializers.ValidationError({
                "is_active": (
                    "New categories must be created inactive. "
                    "Activate the category in a separate update."
                )
            })

        return attrs
