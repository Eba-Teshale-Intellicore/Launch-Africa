from django.urls import path

from categories.views.categories import (
    CategoryDetailView,
    CategoryListCreateView,
)

app_name = "categories"

urlpatterns = [
    path(
        "",
        CategoryListCreateView.as_view(),
        name="category-list-create",
    ),
    path(
        "<slug:slug>/",
        CategoryDetailView.as_view(),
        name="category-detail",
    ),
]