from django.contrib import admin

from products.models.productimage import ProductImage
from products.models.products import Products


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = (
        "public_id",
        "secure_url",
        "alt_text",
        "display_order",
        "is_primary",
    )
    readonly_fields = (
        "public_id",
        "secure_url",
    )


@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "display_categories",
        "status",
        "published_at",
        "created_at",
    )

    list_filter = (
        "status",
        "categories",
        "country",
        "created_at",
    )

    search_fields = (
        "title",
        "tagline",
        "description",
        "owner__email",
        "categories__name",
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

    @admin.display(description="Categories")
    def display_categories(self, obj):
        return ", ".join(
            obj.categories.values_list("name", flat=True)
        ) or "No categories"

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