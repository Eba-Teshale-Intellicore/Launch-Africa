
from django.db import IntegrityError, models, transaction
from django.db.models.functions import Lower
from django.utils.text import slugify

from common.models import BaseModel


class Category(BaseModel):
    name = models.CharField(
        max_length=253,
    )
    slug = models.SlugField(
        max_length=253,
        unique=True,
        blank=True,
    )
    description = models.TextField(
        blank=True,
        default="",
    )
    icon_name = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )
    is_active = models.BooleanField(
        default=False,
        db_index=True,
    )
    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["display_order", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="unique_category_name_ci",
            ),
        ]

    def save(self, *args, **kwargs):
        # Generate the slug only once. Existing slugs remain stable
        # when a category name changes.
        if self.slug:
            return super().save(*args, **kwargs)

        base_slug = slugify(self.name)[:253].strip("-")

        if not base_slug:
            base_slug = "category"

        # Attempt a unique slug. The database constraint remains
        # the final protection against concurrent writes.
        for number in range(1, 1000):
            if number == 1:
                candidate = base_slug
            else:
                suffix = f"-{number}"
                candidate = (
                    f"{base_slug[:253 - len(suffix)]}{suffix}"
                )

            self.slug = candidate

            try:
                with transaction.atomic():
                    return super().save(*args, **kwargs)

            except IntegrityError:
                # Retry only if another record now owns this slug.
                # Other integrity errors, such as a duplicate name,
                # must propagate instead of being hidden.
                slug_exists = (
                    type(self).objects.filter(slug=candidate)
                    .exclude(pk=self.pk)
                    .exists()
                )

                if not slug_exists:
                    raise

        self.slug = ""
        raise RuntimeError(
            "Could not generate a unique category slug."
        )

    def __str__(self):
        return self.name
