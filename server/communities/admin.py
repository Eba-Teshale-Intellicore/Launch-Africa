from django.contrib import admin

from communities.models.comments import Comments
from communities.models.votes import Votes


@admin.register(Comments)
class CommentsAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "product",
        "author",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "body",
        "author__email",
        "product__title",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    list_per_page = 25


@admin.register(Votes)
class VotesAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("product__title", "user__email")
    readonly_fields = (
        "id",
        "product",
        "user",
        "created_at",
        "updated_at",
    )
    list_per_page = 25