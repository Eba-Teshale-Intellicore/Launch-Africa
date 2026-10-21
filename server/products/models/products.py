
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from common.models import BaseModel
from categories.models.categories import Category


https_url_validator = URLValidator(schemes=["https"])


def validate_country_code(value):
    if value and not re.fullmatch(r"[A-Z]{2}", value):
        raise ValidationError(
            "Country must be a two-letter uppercase country code."
        )


def validate_languages(value):
    if not isinstance(value, list):
        raise ValidationError("Languages must be a list.")

    if len(value) > 10:
        raise ValidationError("A maximum of 10 languages is allowed.")

    for language in value:
        if not isinstance(language, str) or not re.fullmatch(
            r"[a-z]{2,3}", language
        ):
            raise ValidationError(
                "Each language must be a valid lowercase "
                "two- or three-letter language code."
            )

    if len(value) != len(set(value)):
        raise ValidationError("Duplicate languages are not allowed.")


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

    country = models.CharField(
        max_length=2,
        blank=True,
        validators=[validate_country_code],
    )

    languages = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_languages],
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
            base_slug = (
                slugify(self.title)[:180].strip("-") or "product"
            )

            candidate = base_slug
            number = 2

            while (
                Products.objects.filter(slug=candidate)
                .exclude(pk=self.pk)
                .exists()
            ):
                suffix = f"-{number}"
                candidate = (
                    f"{base_slug[:180 - len(suffix)].rstrip('-')}"
                    f"{suffix}"
                )
                number += 1

            self.slug = candidate

        previous_status = None

        if self.pk:
            previous_status = (
                Products.objects.filter(pk=self.pk)
                .values_list("status", flat=True)
                .first()
            )

        # Set the timestamp on initial publication or republishing.
        if (
            self.status == self.Status.PUBLISHED
            and (
                previous_status != self.Status.PUBLISHED
                or self.published_at is None
            )
        ):
            self.published_at = timezone.now()

            # Ensure the timestamp is persisted when callers
            # use save(update_fields=[...]).
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = set(update_fields) | {
                    "published_at"
                }

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
