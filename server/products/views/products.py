from django.db.models import Q
from django.utils import timezone

from rest_framework import generics, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from categories.models.categories import Category
from products.models.products import Products
from common.permissions import (
    IsAdminUserRole,
    IsOwnerOrAdminOrReadOnly,
)
from products.serializers.products import ProductsSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductsSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Products.objects.select_related(
            "owner", "category"
        )

        # Public visitors see published products only.
        if not (
            self.request.user.is_authenticated
            and (
                self.request.user.is_staff
                or self.request.user.is_superuser
                or getattr(self.request.user, "role", None) == "admin"
            )
        ):
            queryset = queryset.filter(status=Products.Status.PUBLISHED)

        return queryset.order_by("-published_at", "-created_at")

    def perform_create(self, serializer):
        # The owner comes from authentication, not request JSON.
        serializer.save(
            owner=self.request.user,
            status=Products.Status.DRAFT,
        )


class ProductDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductsSerializer
    permission_classes = [IsOwnerOrAdminOrReadOnly]
    lookup_field = "slug"
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Products.objects.select_related(
            "owner", "category"
        )

        user = self.request.user
        is_admin = (
            user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or getattr(user, "role", None) == "admin"
            )
        )

        if is_admin:
            return queryset

        if user.is_authenticated:
            return queryset.filter(
                Q(status=Products.Status.PUBLISHED)
                | Q(owner=user)
            )

        return queryset.filter(status=Products.Status.PUBLISHED)

    def perform_update(self, serializer):
        product = self.get_object()

        # Do not allow editing to publish a product automatically.
        # The serializer also makes status read-only.
        if product.status == Products.Status.PUBLISHED:
            # This example allows ordinary edits to published products.
            # If your policy requires re-review after edits, implement
            # that workflow explicitly here.
            pass

        serializer.save()


class ProductModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ["status"]

    def validate_status(self, value):
        allowed = {
            Products.Status.PENDING,
            Products.Status.PUBLISHED,
            Products.Status.REJECTED,
            Products.Status.ARCHIVED,
        }

        if value not in allowed:
            raise serializers.ValidationError(
                "This status is not allowed for moderation."
            )

        return value

    def validate(self, attrs):
        product = self.instance
        new_status = attrs.get("status")

        if (
            new_status == Products.Status.PUBLISHED
            and not product.category.is_active
        ):
            raise serializers.ValidationError(
                "A product cannot be published under an inactive category."
            )

        return attrs

    def update(self, instance, validated_data):
        new_status = validated_data["status"]

        if new_status == Products.Status.PUBLISHED:
            if not instance.published_at:
                instance.published_at = timezone.now()

        instance.status = new_status
        instance.save(update_fields=["status", "published_at", "updated_at"])

        return instance


class ProductModerationView(generics.UpdateAPIView):
    queryset = Products.objects.select_related("category")
    serializer_class = ProductModerationSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = "slug"
    http_method_names = ["patch", "head", "options"]