from django.conf import settings
from django.core.validators import URLValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from common.models import BaseModel
from categories.models.categories import Category


https_url_validator = URLValidator(schemes=["https"])


class Products(BaseModel):

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending Review"
        PUBLISHED = "published", "Published"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="products",
    )

    title = models.CharField(max_length=150)

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True,
    )

    tagline = models.CharField(max_length=120)

    description = models.TextField(max_length=5000)

    website_url = models.URLField(
        max_length=500,
        validators=[https_url_validator],
    )

    demo_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    logo_public_id = models.CharField(
        max_length=255,
        blank=True,
    )

    logo_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    # Store an ISO 3166-1 alpha-2 country code, e.g. "ET".
    country = models.CharField(
        max_length=2,
        blank=True,
    )

    # Example: ["en", "am"]
    languages = models.JSONField(
        default=list,
        blank=True,
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(
                fields=["category", "status", "-published_at"],
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:180].strip("-")
            slug = base_slug or "product"
            candidate = slug
            number = 2

            while Products.objects.filter(slug=candidate).exclude(
                pk=self.pk
            ).exists():
                suffix = f"-{number}"
                candidate = f"{base_slug[:180 - len(suffix)]}{suffix}"
                number += 1

            self.slug = candidate

        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title