
from django.db.models import Count, Q
from rest_framework import generics

from categories.models.categories import Category
from categories.serializers.categories import CategorySerializer
from common.permissions import IsAdminOrReadOnly, is_admin



def category_queryset_for_user(user):
    """
    Return categories visible to the supplied user.

    Administrators can see inactive categories.
    Everyone else can see active categories only.
    """
    queryset = Category.objects.all()

    # Public users see active categories only.
    if not is_admin(user):
        queryset = queryset.filter(is_active=True)

    return (
        queryset.annotate(
            product_count=Count(
                "products",
                filter=Q(products__status="published"),
                distinct=True,
            )
        )
        .order_by("display_order", "-created_at")
    )
# ListCreateAPIView supports two main operations:
# - GET — retrieve a list of categories.
# - POST — create a new category.
class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return category_queryset_for_user(self.request.user)

    def perform_create(self, serializer):
        # New categories require explicit activation.
        serializer.save(is_active=False)


class CategoryDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    http_method_names = [
        "get",
        "put",
        "patch",
        "head",
        "options",
    ]

    def get_queryset(self):
        return category_queryset_for_user(self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()

        # Prevent an inactive category from being activated
        # accidentally through a normal category edit.
        # Admins may explicitly activate it via PATCH.
        serializer.save()

    # def update(self, request, *args, **kwargs):
    #     if (
    #         request.method == "PUT"
    #         and "is_active" in request.data
    #     ):
    #         raise ValidationError({
    #             "is_active": (
    #                 "Change category activation using PATCH."
    #             )
    #         })

    #     return super().update(request, *args, **kwargs)




