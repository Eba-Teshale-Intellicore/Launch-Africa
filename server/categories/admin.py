
from django.contrib import admin

from categories.models.categories import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "display_order",
        "created_at",
    )
    list_filter = (
        "is_active",
        "created_at",
    )
    search_fields = (
        "name",
        "slug",
        "description",
    )
    ordering = (
        "display_order",
        "name",
    )
    readonly_fields = (
        "slug",
        "created_at",
        "updated_at",
    )
    list_editable = (
        "is_active",
        "display_order",
    )
    list_per_page = 50
