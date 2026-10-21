
from django.core.validators import URLValidator
from django.db import models
from django.db.models import Q

from common.models import BaseModel
from .products import Products


https_url_validator = URLValidator(schemes=["https"])


class ProductImage(BaseModel):
    product = models.ForeignKey(
        Products,
        on_delete=models.CASCADE,
        related_name="images",
    )

    cloudinary_public_id = models.CharField(
        max_length=253,
        unique=True,
    )

    secure_url = models.URLField(
        max_length=500,
        validators=[https_url_validator],
    )

    alt_text = models.CharField(
        max_length=250,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    class Meta:
        ordering = ["display_order", "created_at"]

        indexes = [
            models.Index(
                fields=["product", "display_order"],
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["product", "display_order"],
                name="unique_product_image_order",
            ),
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="unique_primary_image_per_product",
            ),
        ]

    def __str__(self):
        return f"Image for {self.product.title}"
