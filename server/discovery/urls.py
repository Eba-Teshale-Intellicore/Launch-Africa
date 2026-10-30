
from django.urls import path

from .views import GlobalSearchView

app_name = "discovery"

urlpatterns = [
    path(
        "",
        GlobalSearchView.as_view(),
        name="global-search",
    ),
]
