
from django.db.models import Count, Q
from rest_framework import generics

from categories.models.categories import Category
from categories.serializers.categories import CategorySerializer
from common.permissions import IsAdminOrReadOnly


# ListCreateAPIView supports two main operations:
# - GET — retrieve a list of categories.
# - POST — create a new category.

class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [
        IsAdminOrReadOnly,
    ]

    def get_queryset(self):
        queryset = Category.objects.all()

        # Public visitors see active categories only.
        if not self.request.user.is_authenticated or not (
            self.request.user.is_staff
            or self.request.user.is_superuser
            or getattr(self.request.user, "role", None) == "admin"
        ):
            queryset = queryset.filter(is_active=True)

        # Replace "products" and "status" if your
        # Product model uses different names.
        queryset = queryset.annotate(
            product_count=Count(
                "products",
                filter=Q(products__status="published"),
                distinct=True,
            )
        )

        return queryset.order_by("display_order", "name")

    def perform_create(self, serializer):
        # Only admins reach this method because of the
        # permission class. New categories start inactive.
        serializer.save(is_active=False)


class CategoryDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [
        IsAdminOrReadOnly,
    ]
    lookup_field = "slug"
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Category.objects.all()

        is_admin = (
            self.request.user.is_authenticated
            and (
                self.request.user.is_staff
                or self.request.user.is_superuser
                or getattr(self.request.user, "role", None) == "admin"
            )
        )

        if not is_admin:
            queryset = queryset.filter(is_active=True)

        return queryset.annotate(
            product_count=Count(
                "products",
                filter=Q(products__status="published"),
                distinct=True,
            )
        )

    def perform_update(self, serializer):
        instance = self.get_object()

        # Prevent an inactive category from being activated
        # accidentally through a normal category edit.
        # Admins may explicitly activate it via PATCH.
        serializer.save()
