from django.urls import path

from products.views.productimage import (
    ProductImageDetailView,
    ProductImageListCreateView,
)
from products.views.productlogo import ProductLogoUploadView
from products.views.products import (
    ProductDetailView,
    ProductListCreateView,
    ProductModerationView,
)

app_name = "products"

urlpatterns = [
  
    # Individual image operations
    path(
        "images/<uuid:pk>/",
        ProductImageDetailView.as_view(),
        name="product-image-detail",
    ),

    # Product-specific operations
    path(
        "<slug:product_slug>/images/",
        ProductImageListCreateView.as_view(),
        name="product-image-list-create",
    ),
    path(
        "<slug:slug>/logo/",
        ProductLogoUploadView.as_view(),
        name="product-logo-upload",
    ),
    path(
        "<slug:slug>/moderate/",
        ProductModerationView.as_view(),
        name="product-moderate",
    ),

    # General product routes
    path(
        "",
        ProductListCreateView.as_view(),
        name="product-list-create",
    ),
    path(
        "<slug:slug>/",
        ProductDetailView.as_view(),
        name="product-detail",
    ),
]