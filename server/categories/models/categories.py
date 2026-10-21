# categories/models/categories.py

from django.db import models
from django.db.models.functions import Lower
from django.utils.text import slugify

from common.models import BaseModel


class Category(BaseModel):
    name = models.CharField(
        max_length=253,
        unique=True,
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
    is_active = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name"]

        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="unique_category_name_ci",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)[:253].strip("-")

            if not base_slug:
                base_slug = "category"

            candidate = base_slug
            number = 2

            while (
                Category.objects.filter(slug=candidate)
                .exclude(pk=self.pk)
                .exists()
            ):
                suffix = f"-{number}"
                candidate = (
                    f"{base_slug[:253 - len(suffix)]}{suffix}"
                )
                number += 1

            self.slug = candidate

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
