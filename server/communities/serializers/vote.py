from rest_framework import serializers

from communities.models.votes import Votes
from products.models.products import Products


class ProductsSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ["id", "title", "slug"]


class VotesSerializers(serializers.ModelSerializer):
    product = ProductsSummarySerializer(read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Votes
        fields = [
            "id",
            "product",
            "user",
            "created_at",
        ]
        read_only_fields = fields