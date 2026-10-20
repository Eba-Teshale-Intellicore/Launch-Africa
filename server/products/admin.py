from django.contrib import admin

from products.models.products import Products
from products.models.productimage import ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = (
        "cloudinary_public_id",
        "secure_url",
        "alt_text",
        "display_order",
        "is_primary",
    )
    readonly_fields = (
        "cloudinary_public_id",
        "secure_url",
    )


@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "category",
        "status",
        "published_at",
        "created_at",
    )

    list_filter = (
        "status",
        "category",
        "country",
        "created_at",
    )

    search_fields = (
        "title",
        "tagline",
        "description",
        "owner__email",
    )

    readonly_fields = (
        "id",
        "slug",
        "published_at",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
    list_per_page = 25

    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "alt_text",
        "display_order",
        "is_primary",
        "created_at",
    )

    list_filter = ("is_primary", "created_at")
    search_fields = ("product__title", "alt_text", "cloudinary_public_id")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("product", "display_order")