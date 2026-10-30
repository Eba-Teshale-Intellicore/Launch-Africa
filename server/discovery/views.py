from django.shortcuts import render

# Create your views here.

from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from products.models.products import Products
from categories.models.categories import Category

from .serializers import (
    ProductSearchSerializer,
    CategorySearchSerializer,
    BuilderSearchSerializer,
)


User = get_user_model()


class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    RESULT_LIMIT = 5
    MIN_QUERY_LENGTH = 2
    MAX_QUERY_LENGTH = 100

    def get(self, request):
        query = request.query_params.get("q", "").strip()

        if len(query) > self.MAX_QUERY_LENGTH:
            return Response(
                {"detail": "Search query is too long."},
                status=400,
            )

        if len(query) < self.MIN_QUERY_LENGTH:
            return Response({
                "query": query,
                "products": [],
                "categories": [],
                "builders": [],
            })

        # 1. Search published products.
        products = (
            Products.objects
            .filter(
                status=Products.Status.PUBLISHED,
                owner__is_active=True,
                category__is_active=True,
            )
            .filter(
                Q(title__icontains=query)
                | Q(tagline__icontains=query)
                | Q(description__icontains=query)
                | Q(category__name__icontains=query)
            )
            .select_related("category", "owner")
            .order_by("-published_at", "-created_at")
            [:self.RESULT_LIMIT]
        )

        # 2. Search active categories.
        categories = (
            Category.objects
            .filter(is_active=True)
            .filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
            )
            .order_by("display_order", "name")
            [:self.RESULT_LIMIT]
        )

        # 3. Search active builder accounts.
        builders = (
            User.objects
            .filter(
                is_active=True,
                role=User.Role.BUILDER,
            )
            .filter(
                Q(username__icontains=query)
                | Q(profile__display_name__icontains=query)
                | Q(profile__bio__icontains=query)
            )
            .select_related("profile")
            .distinct()
            .order_by("-date_joined")
            [:self.RESULT_LIMIT]
        )

        return Response({
            "query": query,

            "products": ProductSearchSerializer(
                products,
                many=True,
            ).data,

            "categories": CategorySearchSerializer(
                categories,
                many=True,
            ).data,

            "builders": BuilderSearchSerializer(
                builders,
                many=True,
            ).data,
        })
