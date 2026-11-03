from django.urls import path

from communities.views.comments import (
    CommentDetailView,
    ProductCommentListCreateView,
)
from communities.views.votes import ProductVoteView

app_name = "communities"

urlpatterns = [
    path(
        "products/<slug:product_slug>/comments/",
        ProductCommentListCreateView.as_view(),
        name="product-comments",
    ),
    path(
        "comments/<uuid:pk>/",
        CommentDetailView.as_view(),
        name="comment-detail",
    ),
    path(
        "products/<slug:product_slug>/vote/",
        ProductVoteView.as_view(),
        name="product-vote",
    ),
]