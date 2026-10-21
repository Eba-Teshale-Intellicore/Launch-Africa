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
        return get_object_or_404(
            Products,
            slug=self.kwargs["product_slug"],
            status=Products.Status.PUBLISHED,
        )

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
        product = self.get_product()

        serializer.save(
            product=product,
            author=self.request.user,
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentsSerializers
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = [
        "get",
        "put",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        queryset = Comments.objects.select_related(
            "author",
            "product",
        )

        user = self.request.user

        # Admins can access comments on any product status.
        if user.is_authenticated and is_admin(user):
            return queryset

        # Non-admin users only access comments on published products.
        queryset = queryset.filter(
            product__status=Products.Status.PUBLISHED,
        )

        if user.is_authenticated:
            # Authors can inspect their own hidden comments,
            # but removed comments are not exposed to ordinary users.
            return queryset.filter(
                Q(status=Comments.Status.VISIBLE)
                | Q(
                    author=user,
                    status=Comments.Status.HIDDEN,
                )
            )

        return queryset.filter(status=Comments.Status.VISIBLE)

    def check_can_modify(self, comment):
        user = self.request.user

        if user.is_authenticated and is_admin(user):
            return

        if comment.author_id != user.pk:
            raise PermissionDenied(
                "You can modify only your own comments."
            )

        if comment.status != Comments.Status.VISIBLE:
            raise PermissionDenied(
                "Only visible comments can be edited or deleted."
            )

    def perform_update(self, serializer):
        comment = serializer.instance
        self.check_can_modify(comment)
        serializer.save()

    def perform_destroy(self, instance):
        self.check_can_modify(instance)

        # Preserve the record for moderation and audit purposes.
        instance.status = Comments.Status.REMOVED
        instance.save(update_fields=["status", "updated_at"])