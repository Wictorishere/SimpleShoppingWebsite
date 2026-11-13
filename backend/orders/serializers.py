from rest_framework import serializers

from .models import Order, OrderItem
from .services import create_order


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(
        min_value=1,
        max_value=10000,
    )


class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(min_value=1)

    items = OrderItemInputSerializer(
        many=True,
        allow_empty=False,
        max_length=100,
    )

    note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
        default="",
    )

    def validate_items(self, items):
        product_ids = [item["product_id"] for item in items]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                "هر محصول را فقط یک بار ارسال کنید و تعداد را مشخص کنید.",
            )

        return items

    def create(self, validated_data):
        return create_order(
            user=self.context["request"].user,
            **validated_data,
        )


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(
        max_digits=18,
        decimal_places=0,
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "unit_price",
            "quantity",
            "subtotal",
        ]
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "status_display",
            "total_price",
            "created_at",
        ]
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "status_display",
            "recipient_name",
            "recipient_phone",
            "province",
            "city",
            "street_address",
            "postal_code",
            "total_price",
            "note",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
