
import logging

import cloudinary.uploader
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import is_admin
from products.models.products import Products
from products.serializers.products import ProductsSerializer

logger = logging.getLogger(__name__)

MAX_LOGO_SIZE = 5 * 1024 * 1024
ALLOWED_LOGO_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_LOGO_FORMATS = ["jpg", "jpeg", "png", "webp"]


class ProductLogoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        product = get_object_or_404(
            Products.objects.select_related("owner").prefetch_related("categories"),
            slug=slug,
        )

        user = request.user
        admin_user = is_admin(user)

        # Only the product owner or an admin may upload its logo.
        if not admin_user and product.owner_id != user.pk:
            raise PermissionDenied(
                "You cannot upload a logo for this product."
            )

        # Owners cannot modify logos on rejected or archived products.
        if (
            not admin_user
            and product.status in {
                Products.Status.REJECTED,
                Products.Status.ARCHIVED,
            }
        ):
            raise PermissionDenied(
                "Logos cannot be changed on rejected or archived products."
            )

        logo = request.FILES.get("logo")

        if not logo:
            raise ValidationError({
                "logo": "Please select a logo file."
            })

        if logo.size > MAX_LOGO_SIZE:
            raise ValidationError({
                "logo": "The logo must be 5 MB or smaller."
            })

        if logo.content_type not in ALLOWED_LOGO_TYPES:
            raise ValidationError({
                "logo": "Only JPG, PNG, and WebP images are supported."
            })

        # Upload to the product-specific Cloudinary folder.
        try:
            result = cloudinary.uploader.upload(
                logo,
                resource_type="image",
                folder=f"launchafrica/products/{product.pk}",
                public_id="logo",
                overwrite=True,
                allowed_formats=ALLOWED_LOGO_FORMATS,
            )
        except Exception as exc:
            # Keep Cloudinary credentials and internal errors out of
            # the response returned to the frontend.
          logger.exception(
              "Cloudinary logo upload failed for product %s",
              product.pk,
          )
          raise APIException(
              "The logo could not be uploaded. Please try again."
          ) from exc

        public_id = result.get("public_id")
        secure_url = result.get("secure_url")
        uploaded_format = result.get("format")
        uploaded_bytes = result.get("bytes", 0)

        # Verify the basic properties returned by Cloudinary.
        if (
            not public_id
            or not isinstance(secure_url, str)
            or not secure_url.startswith("https://")
            or uploaded_format not in ALLOWED_LOGO_FORMATS
            or uploaded_bytes > MAX_LOGO_SIZE
        ):
            raise APIException(
                "Cloudinary returned an invalid logo asset."
            )

        # Save the logo and update the review status together.
        with transaction.atomic():
            product = get_object_or_404(
                Products.objects.select_for_update(),
                pk=product.pk,
            )

            # Recheck permissions and status after acquiring the lock.
            if not admin_user and product.owner_id != user.pk:
                raise PermissionDenied(
                    "You cannot upload a logo for this product."
                )

            if (
                not admin_user
                and product.status in {
                    Products.Status.REJECTED,
                    Products.Status.ARCHIVED,
                }
            ):
                raise PermissionDenied(
                    "Logos cannot be changed on rejected or archived products."
                )

            product.logo_public_id = public_id
            product.logo_url = secure_url

            if (
                not admin_user
                and product.status == Products.Status.PUBLISHED
            ):
                product.status = Products.Status.PENDING

            product.save(
                update_fields=[
                    "logo_public_id",
                    "logo_url",
                    "status",
                    "updated_at",
                ]
            )

        serializer = ProductsSerializer(
            product,
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
