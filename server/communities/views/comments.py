from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from communities.models.comments import Comments
from communities.serializers.comments import CommentsSerializers
from products.models.products import Products
from common.permissions import is_admin


class ProductCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentsSerializers
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_product(self):
        product = get_object_or_404(
            Products,
            slug=self.kwargs["product_slug"],
        )

        if product.status != Products.Status.PUBLISHED:
            raise PermissionDenied(
                "Comments are available only for published products."
            )

        return product

    def get_queryset(self):
        product = self.get_product()

        return (
            Comments.objects.filter(
                product=product,
                status=Comments.Status.VISIBLE,
            )
            .select_related("author", "product")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("Sign in to comment.")

        product = self.get_product()

        serializer.save(
            product=product,
            author=self.request.user,
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentsSerializers
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ["get", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = Comments.objects.filter(
            product__status=Products.Status.PUBLISHED,
        ).select_related("author", "product")

        user = self.request.user

        if is_admin(user):
            return queryset

        if user.is_authenticated:
            return queryset.filter(
                Q(status=Comments.Status.VISIBLE)
                | Q(author=user)
            )

        return queryset.filter(status=Comments.Status.VISIBLE)

    def perform_update(self, serializer):
        comment = self.get_object()
        user = self.request.user

        if not is_admin(user) and comment.author_id != user.pk:
            raise PermissionDenied(
                "You can edit only your own comments."
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if not is_admin(user) and instance.author_id != user.pk:
            raise PermissionDenied(
                "You can delete only your own comments."
            )

        instance.delete()