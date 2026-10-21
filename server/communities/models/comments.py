from django.conf import settings
from django.db import models

from common.models import BaseModel
from products.models.products import Products


class Comments(BaseModel):
    class Status(models.TextChoices):
        VISIBLE = "visible", "Visible"
        HIDDEN = "hidden", "Hidden"
        REMOVED = "removed", "Removed"

    product = models.ForeignKey(
        Products,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="comments",
    )

    body = models.TextField(max_length=2000)

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.VISIBLE,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["product", "status", "-created_at"],
                name="cmt_prod_stat_created_idx",
            ),
        ]
        

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    status__in=["visible", "hidden", "removed"]
                ),
                name="comment_status_valid",
            ),
        ]

    def __str__(self):
        return f"Comment by {self.author} on {self.product.title}"