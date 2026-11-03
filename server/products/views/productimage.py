
import logging

import cloudinary.uploader
from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import (
    APIException,
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.permissions import is_admin
from products.models.productimage import ProductImage
from products.models.products import Products
from products.serializers.productimage import ProductImageSerializer

logger = logging.getLogger(__name__)

MAX_IMAGES_PER_PRODUCT = 5
MAX_IMAGE_SIZE = 5 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_IMAGE_FORMATS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
}

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
        product.save(
            update_fields=["status", "updated_at"]
        )


def cleanup_uploaded_asset(public_id):
    """
    Best-effort cleanup for an uploaded asset that could not be saved.
    """
    if not public_id:
        return

    try:
        cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            type="upload",
            invalidate=True,
        )
    except Exception:
        logger.exception(
            "Failed to clean up Cloudinary image %s",
            public_id,
        )


def delete_cloudinary_asset(public_id):
    """
    Delete a registered image from Cloudinary.
    """
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            type="upload",
            invalidate=True,
        )
    except Exception as exc:
        logger.exception(
            "Cloudinary deletion failed for image %s",
            public_id,
        )
        raise APIException(
            "Cloudinary deletion failed. The image record was not deleted."
        ) from exc

    if result.get("result") not in {"ok", "not found"}:
        raise APIException(
            "Cloudinary did not confirm image deletion."
        )


class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer

    def get_permissions(self):
        if self.request.method in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_product(self):
        return get_object_or_404(
            Products,
            slug=self.kwargs["product_slug"],
        )

    def get_queryset(self):
        product = self.get_product()
        user = self.request.user

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
        user = self.request.user

        # Check ownership and product status before uploading.
        ensure_owner_can_manage_images(user, product)

        image = self.request.FILES.get("image")

        if not image:
            raise ValidationError({
                "image": "Please select an image file."
            })

        if image.size <= 0:
            raise ValidationError({
                "image": "The selected image is empty."
            })

        if image.size > MAX_IMAGE_SIZE:
            raise ValidationError({
                "image": "Images must be 5 MB or smaller."
            })

        # This is an early check. The limit is checked again
        # while holding the product database lock below.
        if (
            ProductImage.objects.filter(product=product).count()
            >= MAX_IMAGES_PER_PRODUCT
        ):
            raise ValidationError(
                "A product can have at most five images."
            )

        # Reject unsupported browser-reported types early.
        # Cloudinary's returned format is checked separately.
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise ValidationError({
                "image": "Only JPG, PNG, and WebP images are supported."
            })

        # Upload using backend Cloudinary credentials.
        try:
            result = cloudinary.uploader.upload(
                image,
                resource_type="image",
                folder=(
                    f"launchafrica/products/{product.pk}/images"
                ),
                allowed_formats=sorted(ALLOWED_IMAGE_FORMATS),
            )
        except Exception as exc:
            logger.exception(
                "Cloudinary image upload failed for product %s",
                product.pk,
            )
            raise APIException(
                "The image could not be uploaded to Cloudinary."
            ) from exc

        public_id = result.get("public_id")
        secure_url = result.get("secure_url")
        uploaded_format = result.get("format")
        uploaded_bytes = result.get("bytes")
        width = result.get("width")
        height = result.get("height")

        # Validate Cloudinary's response before saving anything.
        valid_asset = (
            isinstance(public_id, str)
            and bool(public_id.strip())
            and isinstance(secure_url, str)
            and secure_url.startswith("https://")
            and result.get("resource_type") == "image"
            and uploaded_format in ALLOWED_IMAGE_FORMATS
            and isinstance(uploaded_bytes, int)
            and 0 < uploaded_bytes <= MAX_IMAGE_SIZE
            and isinstance(width, int)
            and width > 0
            and isinstance(height, int)
            and height > 0
        )

        if not valid_asset:
            cleanup_uploaded_asset(public_id)
            raise APIException(
                "Cloudinary returned an invalid image asset."
            )

        try:
            with transaction.atomic():
                # Lock the product so concurrent uploads cannot
                # both exceed the image limit or choose the same order.
                locked_product = get_object_or_404(
                    Products.objects.select_for_update(),
                    pk=product.pk,
                )

                ensure_owner_can_manage_images(
                    user,
                    locked_product,
                )

                images = ProductImage.objects.filter(
                    product=locked_product
                )

                image_count = images.count()

                if image_count >= MAX_IMAGES_PER_PRODUCT:
                    raise ValidationError(
                        "A product can have at most five images."
                    )

                # Avoid registering an asset twice.
                if ProductImage.objects.filter(
                    public_id=public_id
                ).exists():
                    raise ValidationError(
                        "This Cloudinary image is already registered."
                    )

                max_order = images.aggregate(
                    value=Max("display_order")
                )["value"]

                next_order = (
                    0 if max_order is None else max_order + 1
                )

                # The first registered image becomes the primary image.
                serializer.save(
                    product=locked_product,
                    public_id=public_id,
                    secure_url=secure_url,
                    display_order=next_order,
                    is_primary=(image_count == 0),
                )

                send_published_product_back_to_review(
                    user,
                    locked_product,
                )

        except Exception:
            # The database save failed, so try to remove the
            # uploaded asset and avoid leaving an orphan behind.
            cleanup_uploaded_asset(public_id)
            raise


class ProductImageDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_permissions(self):
        if self.request.method in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        queryset = ProductImage.objects.select_related(
            "product"
        )

        if self.request.method in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            if user.is_authenticated and is_admin(user):
                return queryset

            if user.is_authenticated:
                return (
                    queryset.filter(
                        product__status=Products.Status.PUBLISHED
                    )
                    | queryset.filter(product__owner=user)
                )

            return queryset.filter(
                product__status=Products.Status.PUBLISHED
            )

        if user.is_authenticated and is_admin(user):
            return queryset

        return queryset.filter(product__owner=user)

    def get_object(self):
        image = super().get_object()

        if self.request.method not in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            ensure_owner_can_manage_images(
                self.request.user,
                image.product,
            )

        return image

    def perform_update(self, serializer):
        with transaction.atomic():
            image = get_object_or_404(
                ProductImage.objects.select_for_update(),
                pk=serializer.instance.pk,
            )

            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=image.product_id,
            )

            ensure_owner_can_manage_images(
                self.request.user,
                product,
            )

            serializer.instance = image
            serializer.save()

            send_published_product_back_to_review(
                self.request.user,
                product,
            )

    def perform_destroy(self, instance):
        user = self.request.user

        ensure_owner_can_manage_images(
            user,
            instance.product,
        )

        # The model field is public_id, not cloudinary_public_id.
        delete_cloudinary_asset(instance.public_id)

        with transaction.atomic():
            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=instance.product_id,
            )

            image = get_object_or_404(
                ProductImage.objects.select_for_update(),
                pk=instance.pk,
            )

            ensure_owner_can_manage_images(
                user,
                product,
            )

            was_primary = image.is_primary
            image.delete()

            remaining = ProductImage.objects.filter(
                product=product
            ).order_by("display_order", "created_at")

            if was_primary:
                replacement = remaining.first()

                if replacement:
                    replacement.is_primary = True
                    replacement.save(
                        update_fields=[
                            "is_primary",
                            "updated_at",
                        ]
                    )

            send_published_product_back_to_review(
                user,
                product,
            )
