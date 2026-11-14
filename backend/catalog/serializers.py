from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    daily_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=0,
        read_only=True,
        allow_null=True,
    )


    class Meta:
        model = Product
        fields = "__all__"
