from django.conf import settings
from django.db import models

from common.models import BaseModel
from products.models.products import Products


class Votes(BaseModel):
    product = models.ForeignKey(
        Products,
        on_delete=models.CASCADE,
        related_name="votes",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="product_votes",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "user"],
                name="unique_vote_per_user_product",
            ),
        ]
        indexes = [
            models.Index(
                fields=["product", "created_at"],
                name="vote_product_created_idx",
            ),
        ]

    def __str__(self):
        return f"Vote by {self.user} for {self.product.title}"