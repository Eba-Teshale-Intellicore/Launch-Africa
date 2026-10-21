from django.db import transaction
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.permissions import is_admin
from products.models.products import Products
from products.models.productimage import ProductImage
from products.serializers.productimage import ProductImageSerializer


MAX_IMAGES_PER_PRODUCT = 5

LOCKED_OWNER_STATUSES = {
    Products.Status.REJECTED,
    Products.Status.ARCHIVED,
}


def can_manage_product(user, product):
    return (
        user.is_authenticated
        and (
            is_admin(user)
            or product.owner_id == user.pk
        )
    )


def verify_cloudinary_asset(public_id, secure_url, product):
    """
    TODO: Connect to the real server-side Cloudinary verification service.

    Verify the asset's existence, ownership, upload authorization,
    HTTPS URL, image format, dimensions, and file size.

    Keep this fail-closed until verification is implemented.
    """
    raise NotImplementedError(
        "Cloudinary verification must be implemented before uploads "
        "can be enabled."
    )


def delete_cloudinary_asset(public_id):
    """
    TODO: Implement durable, retryable Cloudinary cleanup.

    Verify that the asset belongs to this record and is not shared
    before requesting remote deletion.
    """
    raise NotImplementedError(
        "Cloudinary cleanup must be implemented before image deletion "
        "can be enabled."
    )


def ensure_owner_can_manage_images(user, product):
    if not can_manage_product(user, product):
        raise PermissionDenied(
            "You cannot manage images for this product."
        )

    if (
        not is_admin(user)
        and product.status in LOCKED_OWNER_STATUSES
    ):
        raise PermissionDenied(
            "Images cannot be modified on rejected or archived products."
        )


def send_published_product_back_to_review(user, product):
    if (
        not is_admin(user)
        and product.status == Products.Status.PUBLISHED
    ):
        product.status = Products.Status.PENDING
        product.save(update_fields=["status", "updated_at"])


class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_product(self):
        return get_object_or_404(
            Products,
            slug=self.kwargs["product_slug"],
        )

    def get_queryset(self):
        user = self.request.user
        product = self.get_product()

        if product.status == Products.Status.PUBLISHED:
            return ProductImage.objects.filter(
                product=product
            ).select_related("product")

        if can_manage_product(user, product):
            return ProductImage.objects.filter(
                product=product
            ).select_related("product")

        return ProductImage.objects.none()

    def perform_create(self, serializer):
        product = self.get_product()

        ensure_owner_can_manage_images(
            self.request.user, product
        )

        public_id = self.request.data.get("cloudinary_public_id")
        secure_url = self.request.data.get("secure_url")

        if not public_id or not secure_url:
            raise serializers.ValidationError(
                "A verified Cloudinary asset is required."
            )

        # External verification happens before acquiring a database lock.
        verify_cloudinary_asset(public_id, secure_url, product)

        with transaction.atomic():
            # Serialize image creation for this product.
            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=product.pk,
            )

            ensure_owner_can_manage_images(
                self.request.user, product
            )

            image_count = ProductImage.objects.filter(
                product=product
            ).count()

            if image_count >= MAX_IMAGES_PER_PRODUCT:
                raise serializers.ValidationError(
                    "A product can have at most five images."
                )

            max_order = ProductImage.objects.filter(
                product=product
            ).aggregate(
                max_order=Max("display_order")
            )["max_order"]

            next_order = (
                0 if max_order is None else max_order + 1
            )

            serializer.save(
                product=product,
                cloudinary_public_id=public_id,
                secure_url=secure_url,
                display_order=next_order,
                is_primary=False,
            )

            send_published_product_back_to_review(
                self.request.user, product
            )


class ProductImageDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = [
        "get", "patch", "delete", "head", "options"
    ]

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        queryset = ProductImage.objects.select_related("product")

        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            if user.is_authenticated and is_admin(user):
                return queryset

            if user.is_authenticated:
                return queryset.filter(
                    Q(product__status=Products.Status.PUBLISHED)
                    | Q(product__owner=user)
                )

            return queryset.filter(
                product__status=Products.Status.PUBLISHED
            )

        if user.is_authenticated and is_admin(user):
            return queryset

        return queryset.filter(product__owner=user)

    def get_object(self):
        # Uses get_queryset(), so visibility and ownership filtering
        # apply consistently to object retrieval.
        image = super().get_object()

        if self.request.method not in (
            "GET", "HEAD", "OPTIONS"
        ):
            ensure_owner_can_manage_images(
                self.request.user, image.product
            )

        return image

    def perform_update(self, serializer):
        with transaction.atomic():
            image = (
                ProductImage.objects.select_for_update()
                .select_related("product")
                .get(pk=serializer.instance.pk)
            )

            product = Products.objects.select_for_update().get(
                pk=image.product_id
            )

            ensure_owner_can_manage_images(
                self.request.user, product
            )

            serializer.save()

            send_published_product_back_to_review(
                self.request.user, product
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            product = Products.objects.select_for_update().get(
                pk=instance.product_id
            )

            ensure_owner_can_manage_images(
                self.request.user, product
            )

            # Do not delete the database record until remote cleanup
            # is implemented reliably.
            delete_cloudinary_asset(instance.cloudinary_public_id)

            instance.delete()

            send_published_product_back_to_review(
                self.request.user, product
            )