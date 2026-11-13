from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from accounts.models import Address
from catalog.models import Product

from .models import Order, OrderItem


@transaction.atomic
def create_order(*, user, address_id, items, note=""):
    address = (
        Address.objects.select_for_update()
        .filter(pk=address_id, user=user)
        .first()
    )

    if address is None:
        raise ValidationError({
            "address_id": "آدرس پیدا نشد یا متعلق به شما نیست.",
        })

    product_ids = [item["product_id"] for item in items]

    products = {
        product.pk: product
        for product in (
            Product.objects.select_for_update()
            .filter(pk__in=product_ids)
            .order_by("pk")
        )
    }

    total_price = Decimal("0")
    prepared_items = []

    for item in items:
        product_id = item["product_id"]
        quantity = item["quantity"]
        product = products.get(product_id)

        if product is None or not product.is_active or product.is_available:
            raise ValidationError({
                "items": f"محصول با شناسهٔ {product_id} قابل خرید نیست.",
            })

        if product.stock < quantity:
            raise ValidationError({
                "items": f"موجودی محصول «{product.name}» کافی نیست.",
            })

        total_price += product.price * quantity

        prepared_items.append(
            OrderItem(
                product=product,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
            )
        )

    if total_price > Decimal("999999999999999999"):
        raise ValidationError({
            "items": "مبلغ سفارش از حد مجاز بیشتر است.",
        })

    order = Order.objects.create(
        user=user,
        recipient_name=address.recipient_name,
        recipient_phone=address.recipient_phone,
        province=address.province,
        city=address.city,
        street_address=address.street_address,
        postal_code=address.postal_code,
        total_price=total_price,
        note=note,
    )

    for order_item in prepared_items:
        order_item.order = order

    OrderItem.objects.bulk_create(prepared_items)

    for item in items:
        product = products[item["product_id"]]
        product.stock -= item["quantity"]
        product.save(update_fields=["stock"])

    return order
