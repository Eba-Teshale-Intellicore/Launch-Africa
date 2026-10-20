from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated

from products.models.products import Products
from products.models.productimage import ProductImage
from common.permissions import is_admin
from products.serializers.productimage import ProductImageSerializer


MAX_IMAGES_PER_PRODUCT = 5


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
    Connect this function to your server-side Cloudinary integration.

    Verify that:
    - The asset exists in Cloudinary.
    - Its public ID and HTTPS URL match the Cloudinary response.
    - It belongs to the authorized upload workflow for this product.
    - It is an allowed image type and within your size/dimension limits.

    Do not treat client-supplied public IDs or URLs as verified.
    """
    raise NotImplementedError(
        "Connect this function to your Cloudinary verification service."
    )


class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer

    def get_product(self):
        return get_object_or_404(
            Products,
            slug=self.kwargs["product_slug"],
        )

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):
        product = self.get_product()
        queryset = ProductImage.objects.filter(
            product=product,
        ).select_related("product")

        user = self.request.user

        if product.status == Products.Status.PUBLISHED:
            return queryset

        if can_manage_product(user, product):
            return queryset

        return queryset.none()

    def perform_create(self, serializer):
        product = self.get_product()

        if not can_manage_product(self.request.user, product):
            raise PermissionDenied(
                "You cannot manage images for this product."
            )

        if product.status in {
            Products.Status.REJECTED,
            Products.Status.ARCHIVED,
        }:
            raise serializers.ValidationError(
                "Images cannot be added to rejected or archived products."
            )

        public_id = self.request.data.get("cloudinary_public_id")
        secure_url = self.request.data.get("secure_url")

        if not public_id or not secure_url:
            raise serializers.ValidationError(
                "A verified Cloudinary public ID and secure URL are required."
            )

        # This must be implemented before this endpoint is enabled.
        verify_cloudinary_asset(public_id, secure_url, product)

        with transaction.atomic():
            image_count = ProductImage.objects.filter(
                product=product,
            ).count()

            if image_count >= MAX_IMAGES_PER_PRODUCT:
                raise serializers.ValidationError(
                    "A product can have at most five images."
                )

            serializer.save(
                product=product,
                cloudinary_public_id=public_id,
                secure_url=secure_url,
            )


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = [
        "get", "patch", "delete", "head", "options"
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = ProductImage.objects.select_related(
            "product",
        )

        if is_admin(user):
            return queryset

        # Owners can manage their own images.
        # Published product images can be viewed publicly,
        # but public read access is handled in get_permissions.
        return queryset.filter(product__owner=user)

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_object(self):
        image = get_object_or_404(
            ProductImage.objects.select_related("product"),
            pk=self.kwargs["pk"],
        )

        user = self.request.user

        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            if (
                image.product.status == Products.Status.PUBLISHED
                or can_manage_product(user, image.product)
            ):
                return image

            from rest_framework.exceptions import NotFound
            raise NotFound("Image not found.")

        if not can_manage_product(user, image.product):
            raise PermissionDenied(
                "You cannot manage this image."
            )

        return image

    def perform_update(self, serializer):
        # The serializer only permits metadata changes.
        serializer.save()

    def perform_destroy(self, instance):
        # Delete the database record here.
        # Queue Cloudinary deletion through a reliable cleanup
        # service after confirming the asset belongs to this record.
        instance.delete()