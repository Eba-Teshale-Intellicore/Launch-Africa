
from django.db.models import Q
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from common.permissions import (
    IsAdminUserRole,
    IsOwnerOrAdminOrReadOnly,
    is_admin,
)
from products.models.products import Products
from products.serializers.products import ProductsSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductsSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Products.objects.select_related(
            "owner", "category"
        )
        user = self.request.user

        if not (user.is_authenticated and is_admin(user)):
            queryset = queryset.filter(
                status=Products.Status.PUBLISHED
            )

        return queryset.order_by("-published_at", "-created_at")

    def perform_create(self, serializer):
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

        if user.is_authenticated and is_admin(user):
            return queryset

        if user.is_authenticated:
            return queryset.filter(
                Q(status=Products.Status.PUBLISHED)
                | Q(owner=user)
            )

        return queryset.filter(status=Products.Status.PUBLISHED)

    def perform_update(self, serializer):
        product = serializer.instance
        user = self.request.user

        if (
            product.status == Products.Status.PUBLISHED
            and not is_admin(user)
        ):
            serializer.save(status=Products.Status.PENDING)
        else:
            serializer.save()


class ProductModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ["status"]

    ALLOWED_TRANSITIONS = {
        Products.Status.DRAFT: {Products.Status.PENDING},
        Products.Status.PENDING: {
            Products.Status.PUBLISHED,
            Products.Status.REJECTED,
        },
        Products.Status.PUBLISHED: {
            Products.Status.PENDING,
            Products.Status.ARCHIVED,
        },
        Products.Status.REJECTED: {Products.Status.PENDING},
        Products.Status.ARCHIVED: {Products.Status.PENDING},
    }

    def validate_status(self, value):
        product = self.instance
        allowed = self.ALLOWED_TRANSITIONS.get(product.status, set())

        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{product.status}' to '{value}'."
            )

        if (
            value == Products.Status.PUBLISHED
            and not product.category.is_active
        ):
            raise serializers.ValidationError(
                "A product cannot be published under an inactive category."
            )

        if value == Products.Status.PUBLISHED:
            required_fields = [
                "title",
                "tagline",
                "description",
                "website_url",
            ]
            missing = [
                field for field in required_fields
                if not getattr(product, field)
            ]
            if missing:
                raise serializers.ValidationError(
                    "Complete all required product fields before publishing."
                )

        return value

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.save()
        return instance


class ProductModerationView(generics.UpdateAPIView):
    queryset = Products.objects.select_related("category")
    serializer_class = ProductModerationSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = "slug"
    http_method_names = ["patch", "head", "options"]
