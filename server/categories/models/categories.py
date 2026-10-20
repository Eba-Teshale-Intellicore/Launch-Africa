# categories/models/categories.py

from django.db import models
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
        null=True,
    )
    is_active = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name