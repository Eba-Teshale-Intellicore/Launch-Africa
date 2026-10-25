# from django.db import transaction
# from django.db.models import Max, Q
# from django.shortcuts import get_object_or_404

# from rest_framework import generics, serializers
# from rest_framework.exceptions import NotFound, PermissionDenied
# from rest_framework.permissions import AllowAny, IsAuthenticated

# from common.permissions import is_admin
# from products.models.products import Products
# from products.models.productimage import ProductImage
# from products.serializers.productimage import ProductImageSerializer


# MAX_IMAGES_PER_PRODUCT = 5

# LOCKED_OWNER_STATUSES = {
#     Products.Status.REJECTED,
#     Products.Status.ARCHIVED,
# }


# def can_manage_product(user, product):
#     return (
#         user.is_authenticated
#         and (
#             is_admin(user)
#             or product.owner_id == user.pk
#         )
#     )


# def verify_cloudinary_asset(public_id, secure_url, product):
#     """
#     TODO: Connect to the real server-side Cloudinary verification service.

#     Verify the asset's existence, ownership, upload authorization,
#     HTTPS URL, image format, dimensions, and file size.

#     Keep this fail-closed until verification is implemented.
#     """
#     raise NotImplementedError(
#         "Cloudinary verification must be implemented before uploads "
#         "can be enabled."
#     )


# def delete_cloudinary_asset(public_id):
#     """
#     TODO: Implement durable, retryable Cloudinary cleanup.

#     Verify that the asset belongs to this record and is not shared
#     before requesting remote deletion.
#     """
#     raise NotImplementedError(
#         "Cloudinary cleanup must be implemented before image deletion "
#         "can be enabled."
#     )


# def ensure_owner_can_manage_images(user, product):
#     if not can_manage_product(user, product):
#         raise PermissionDenied(
#             "You cannot manage images for this product."
#         )

#     if (
#         not is_admin(user)
#         and product.status in LOCKED_OWNER_STATUSES
#     ):
#         raise PermissionDenied(
#             "Images cannot be modified on rejected or archived products."
#         )


# def send_published_product_back_to_review(user, product):
#     if (
#         not is_admin(user)
#         and product.status == Products.Status.PUBLISHED
#     ):
#         product.status = Products.Status.PENDING
#         product.save(update_fields=["status", "updated_at"])


# class ProductImageListCreateView(generics.ListCreateAPIView):
#     serializer_class = ProductImageSerializer

#     def get_permissions(self):
#         if self.request.method in ("GET", "HEAD", "OPTIONS"):
#             return [AllowAny()]

#         return [IsAuthenticated()]

#     def get_product(self):
#         return get_object_or_404(
#             Products,
#             slug=self.kwargs["product_slug"],
#         )

#     def get_queryset(self):
#         user = self.request.user
#         product = self.get_product()

#         if product.status == Products.Status.PUBLISHED:
#             return ProductImage.objects.filter(
#                 product=product
#             ).select_related("product")

#         if can_manage_product(user, product):
#             return ProductImage.objects.filter(
#                 product=product
#             ).select_related("product")

#         return ProductImage.objects.none()

#     def perform_create(self, serializer):
#         product = self.get_product()

#         ensure_owner_can_manage_images(
#             self.request.user, product
#         )

#         public_id = self.request.data.get("cloudinary_public_id")
#         secure_url = self.request.data.get("secure_url")

#         if not public_id or not secure_url:
#             raise serializers.ValidationError(
#                 "A verified Cloudinary asset is required."
#             )

#         # External verification happens before acquiring a database lock.
#         verify_cloudinary_asset(public_id, secure_url, product)

#         with transaction.atomic():
#             # Serialize image creation for this product.
#             product = get_object_or_404(
#                 Products.objects.select_for_update(),
#                 pk=product.pk,
#             )

#             ensure_owner_can_manage_images(
#                 self.request.user, product
#             )

#             image_count = ProductImage.objects.filter(
#                 product=product
#             ).count()

#             if image_count >= MAX_IMAGES_PER_PRODUCT:
#                 raise serializers.ValidationError(
#                     "A product can have at most five images."
#                 )

#             max_order = ProductImage.objects.filter(
#                 product=product
#             ).aggregate(
#                 max_order=Max("display_order")
#             )["max_order"]

#             next_order = (
#                 0 if max_order is None else max_order + 1
#             )

#             serializer.save(
#                 product=product,
#                 cloudinary_public_id=public_id,
#                 secure_url=secure_url,
#                 display_order=next_order,
#                 is_primary=False,
#             )

#             send_published_product_back_to_review(
#                 self.request.user, product
#             )


# class ProductImageDetailView(
#     generics.RetrieveUpdateDestroyAPIView
# ):
#     serializer_class = ProductImageSerializer
#     permission_classes = [IsAuthenticated]
#     http_method_names = [
#         "get", "patch", "delete", "head", "options"
#     ]

#     def get_permissions(self):
#         if self.request.method in ("GET", "HEAD", "OPTIONS"):
#             return [AllowAny()]

#         return [IsAuthenticated()]

#     def get_queryset(self):
#         user = self.request.user

#         queryset = ProductImage.objects.select_related("product")

#         if self.request.method in ("GET", "HEAD", "OPTIONS"):
#             if user.is_authenticated and is_admin(user):
#                 return queryset

#             if user.is_authenticated:
#                 return queryset.filter(
#                     Q(product__status=Products.Status.PUBLISHED)
#                     | Q(product__owner=user)
#                 )

#             return queryset.filter(
#                 product__status=Products.Status.PUBLISHED
#             )

#         if user.is_authenticated and is_admin(user):
#             return queryset

#         return queryset.filter(product__owner=user)

#     def get_object(self):
#         # Uses get_queryset(), so visibility and ownership filtering
#         # apply consistently to object retrieval.
#         image = super().get_object()

#         if self.request.method not in (
#             "GET", "HEAD", "OPTIONS"
#         ):
#             ensure_owner_can_manage_images(
#                 self.request.user, image.product
#             )

#         return image

#     def perform_update(self, serializer):
#         with transaction.atomic():
#             image = (
#                 ProductImage.objects.select_for_update()
#                 .select_related("product")
#                 .get(pk=serializer.instance.pk)
#             )

#             product = Products.objects.select_for_update().get(
#                 pk=image.product_id
#             )

#             ensure_owner_can_manage_images(
#                 self.request.user, product
#             )

#             serializer.save()

#             send_published_product_back_to_review(
#                 self.request.user, product
#             )

#     def perform_destroy(self, instance):
#         with transaction.atomic():
#             product = Products.objects.select_for_update().get(
#                 pk=instance.product_id
#             )

#             ensure_owner_can_manage_images(
#                 self.request.user, product
#             )

#             # Do not delete the database record until remote cleanup
#             # is implemented reliably.
#             delete_cloudinary_asset(instance.cloudinary_public_id)

#             instance.delete()

#             send_published_product_back_to_review(
#                 self.request.user, product
#             )


















from django.conf import settings
from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404

import cloudinary.api
import cloudinary.uploader

from rest_framework import generics, serializers
from rest_framework.exceptions import APIException, PermissionDenied
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


def verify_cloudinary_asset(public_id, secure_url, product):
    """
    Verify the image exists in Cloudinary and matches the submitted URL.

    The upload flow must separately enforce signed upload authorization
    restricted to this product's folder. Folder matching alone does not
    prove that an upload was authorized.
    """
    if not isinstance(public_id, str) or not public_id.strip():
        raise serializers.ValidationError({
            "cloudinary_public_id": "A valid asset ID is required."
        })

    if not isinstance(secure_url, str) or not secure_url.startswith("https://"):
        raise serializers.ValidationError({
            "secure_url": "A valid HTTPS image URL is required."
        })

    expected_prefix = f"launchafrica/products/{product.pk}/"

    if not public_id.startswith(expected_prefix):
        raise serializers.ValidationError(
            "The image is not associated with this product's upload folder."
        )

    try:
        asset = cloudinary.api.resource(
            public_id,
            resource_type="image",
            type="upload",
        )
    except Exception as exc:
        raise serializers.ValidationError(
            "The Cloudinary asset could not be verified."
        ) from exc

    if asset.get("public_id") != public_id:
        raise serializers.ValidationError(
            "The Cloudinary asset ID does not match."
        )

    if asset.get("resource_type") != "image":
        raise serializers.ValidationError(
            "Only image assets are accepted."
        )

    verified_url = asset.get("secure_url")

    if not verified_url or verified_url != secure_url:
        raise serializers.ValidationError(
            "The submitted URL does not match the verified Cloudinary asset."
        )

    # Example policy limits. Enforce these limits in the upload
    # authorization too, so oversized files are rejected early.
    if asset.get("bytes", 0) > 5 * 1024 * 1024:
        raise serializers.ValidationError(
            "Images must be 5 MB or smaller."
        )

    if asset.get("format") not in {"jpg", "jpeg", "png", "webp"}:
        raise serializers.ValidationError(
            "Only JPG, PNG, and WebP images are supported."
        )

    width = asset.get("width", 0)
    height = asset.get("height", 0)

    if not width or not height:
        raise serializers.ValidationError(
            "The image dimensions could not be verified."
        )


def delete_cloudinary_asset(public_id):
    """
    Delete the remote image.

    For production reliability, replace synchronous deletion with a
    durable cleanup job/outbox and retries. Remote deletion and a
    database transaction cannot form one atomic transaction.
    """
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            type="upload",
            invalidate=True,
        )
    except Exception as exc:
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
        if self.request.method in {"GET", "HEAD", "OPTIONS"}:
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

        ensure_owner_can_manage_images(user, product)

        public_id = self.request.data.get("cloudinary_public_id")
        secure_url = self.request.data.get("secure_url")

        if not public_id or not secure_url:
            raise serializers.ValidationError(
                "A verified Cloudinary asset is required."
            )

        # Do not hold a database lock while calling Cloudinary.
        verify_cloudinary_asset(public_id, secure_url, product)

        with transaction.atomic():
            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=product.pk,
            )

            ensure_owner_can_manage_images(user, product)

            images = ProductImage.objects.filter(product=product)
            image_count = images.count()

            if image_count >= MAX_IMAGES_PER_PRODUCT:
                raise serializers.ValidationError(
                    "A product can have at most five images."
                )

            if ProductImage.objects.filter(
                cloudinary_public_id=public_id
            ).exists():
                raise serializers.ValidationError(
                    "This Cloudinary asset has already been registered."
                )

            max_order = images.aggregate(
                value=Max("display_order")
            )["value"]

            next_order = 0 if max_order is None else max_order + 1

            serializer.save(
                product=product,
                cloudinary_public_id=public_id,
                secure_url=secure_url,
                display_order=next_order,
                is_primary=(image_count == 0),
            )

            send_published_product_back_to_review(user, product)


class ProductImageDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.request.method in {"GET", "HEAD", "OPTIONS"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = ProductImage.objects.select_related("product")

        if self.request.method in {"GET", "HEAD", "OPTIONS"}:
            if user.is_authenticated and is_admin(user):
                return queryset

            if user.is_authenticated:
                return queryset.filter(
                    product__status=Products.Status.PUBLISHED
                ) | queryset.filter(product__owner=user)

            return queryset.filter(
                product__status=Products.Status.PUBLISHED
            )

        if user.is_authenticated and is_admin(user):
            return queryset

        return queryset.filter(product__owner=user)

    def get_object(self):
        image = super().get_object()

        if self.request.method not in {"GET", "HEAD", "OPTIONS"}:
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

            # Save against the freshly locked image instance.
            serializer.instance = image
            serializer.save()

            send_published_product_back_to_review(
                self.request.user,
                product,
            )

    def perform_destroy(self, instance):
        user = self.request.user

        # First check that the caller is allowed to modify this product.
        ensure_owner_can_manage_images(user, instance.product)

        # This synchronous remote deletion is not atomic with the DB.
        # Use a durable cleanup job/outbox for a production deployment.
        delete_cloudinary_asset(instance.cloudinary_public_id)

        with transaction.atomic():
            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=instance.product_id,
            )

            image = get_object_or_404(
                ProductImage.objects.select_for_update(),
                pk=instance.pk,
            )

            ensure_owner_can_manage_images(user, product)

            was_primary = image.is_primary
            image.delete()

            remaining = ProductImage.objects.filter(
                product=product
            ).order_by("display_order", "created_at")

            if was_primary:
                replacement = remaining.first()
                if replacement:
                    replacement.is_primary = True
                    replacement.save(update_fields=["is_primary", "updated_at"])

            # Compact the order values after deletion. The unique
            # constraint means direct sequential updates can collide,
            # so ordering compaction should be implemented separately
            # with a collision-safe temporary range if required.
            send_published_product_back_to_review(user, product)

