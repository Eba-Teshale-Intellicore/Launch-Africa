from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from communities.models.votes import Votes
from products.models.products import Products


class ProductVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_product(self, product_slug):
        return get_object_or_404(
            Products,
            slug=product_slug,
            status=Products.Status.PUBLISHED,
        )

    def get_vote_data(self, product, user):
        vote_count = Votes.objects.filter(product=product).count()
        has_voted = Votes.objects.filter(
            product=product,
            user=user,
        ).exists()

        return {
            "product_id": str(product.pk),
            "vote_count": vote_count,
            "has_voted": has_voted,
        }

    def post(self, request, product_slug):
        """Add a vote. Repeated POST requests do not create duplicates."""
        product = self.get_product(product_slug)

        Votes.objects.get_or_create(
            product=product,
            user=request.user,
        )

        return Response(
            self.get_vote_data(product, request.user),
            status=status.HTTP_200_OK,
        )

    def delete(self, request, product_slug):
        """Remove the current user's vote, if one exists."""
        product = self.get_product(product_slug)

        Votes.objects.filter(
            product=product,
            user=request.user,
        ).delete()

        return Response(
            self.get_vote_data(product, request.user),
            status=status.HTTP_200_OK,
        )