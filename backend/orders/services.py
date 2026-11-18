from decimal import Decimal

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from accounts.models import Address
from catalog.models import Product

from .models import Order, OrderItem


@transaction.atomic
def create_order(
    *,
    user,
    address_id,
    items,
    note="",
    simulated_payment_result=None,
):
    """
    ثبت سفارش با قیمت و موجودی سمت سرور.

    simulated_payment_result:
        None      -> سفارش در انتظار پرداخت
        "success" -> پرداخت موفق آزمایشی
        "failed"  -> پرداخت ناموفق آزمایشی

    هیچ پرداخت واقعی در این سرویس انجام نمی‌شود.

    برای حفظ رفتار قبلی، سفارش pending موجودی را کم می‌کند.
    سفارش payment_failed موجودی را کم نمی‌کند.
    """

    # ---------------------------------------------------------
    # 1. Validate simulated payment
    # ---------------------------------------------------------
    if simulated_payment_result is not None:
        if not getattr(
            settings,
            "ENABLE_SIMULATED_PAYMENTS",
            False,
        ):
            raise ValidationError({
                "simulated_payment_result": (
                    "پرداخت آزمایشی غیرفعال است."
                ),
            })

        if simulated_payment_result not in ("success", "failed"):
            raise ValidationError({
                "simulated_payment_result": (
                    "نتیجهٔ پرداخت آزمایشی معتبر نیست."
                ),
            })

    # ---------------------------------------------------------
    # 2. Validate order items
    # ---------------------------------------------------------
    if not isinstance(items, list) or not items:
        raise ValidationError({
            "items": "سبد خرید نباید خالی باشد.",
        })

    if len(items) > 100:
        raise ValidationError({
            "items": "حداکثر ۱۰۰ نوع محصول در هر سفارش مجاز است.",
        })

    product_ids = []

    for item in items:
        if not isinstance(item, dict):
            raise ValidationError({
                "items": "ساختار اقلام سفارش معتبر نیست.",
            })

        product_id = item.get("product_id")
        quantity = item.get("quantity")

        if (
            not isinstance(product_id, int)
            or isinstance(product_id, bool)
            or product_id < 1
        ):
            raise ValidationError({
                "items": "شناسهٔ محصول باید عدد صحیح مثبت باشد.",
            })

        if (
            not isinstance(quantity, int)
            or isinstance(quantity, bool)
            or quantity < 1
            or quantity > 10000
        ):
            raise ValidationError({
                "items": (
                    "تعداد هر محصول باید عدد صحیح بین ۱ تا ۱۰۰۰۰ باشد."
                ),
            })

        product_ids.append(product_id)

    if len(product_ids) != len(set(product_ids)):
        raise ValidationError({
            "items": (
                "هر محصول را فقط یک بار ارسال کنید "
                "و تعداد آن را در quantity مشخص کنید."
            ),
        })

    # ---------------------------------------------------------
    # 3. Lock and validate address ownership
    # ---------------------------------------------------------
    address = (
        Address.objects.select_for_update()
        .filter(
            pk=address_id,
            user=user,
        )
        .first()
    )

    if address is None:
        raise ValidationError({
            "address_id": "آدرس پیدا نشد یا متعلق به شما نیست.",
        })

    # ---------------------------------------------------------
    # 4. Lock products in a consistent order
    # ---------------------------------------------------------
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

    max_order_total = Decimal("999999999999999999")

    # ---------------------------------------------------------
    # 5. Validate products and calculate server-side prices
    # ---------------------------------------------------------
    for item in items:
        product_id = item["product_id"]
        quantity = item["quantity"]

        product = products.get(product_id)

        if product is None:
            raise ValidationError({
                "items": (
                    f"محصول با شناسهٔ {product_id} پیدا نشد."
                ),
            })

        if not product.is_active:
            raise ValidationError({
                "items": (
                    f"محصول «{product.name}» غیرفعال است."
                ),
            })

        if not product.is_available:
            raise ValidationError({
                "items": (
                    f"محصول «{product.name}» در حال حاضر "
                    "قابل خرید نیست."
                ),
            })

        if product.stock < quantity:
            raise ValidationError({
                "items": (
                    f"موجودی محصول «{product.name}» کافی نیست."
                ),
            })

        # Use the product's database price.
        unit_price = product.price

        # Match the cart's discounted-price rule.
        sale_price = getattr(product, "daily_sale_price", None)

        if (
            sale_price is not None
            and Decimal("0") < sale_price < unit_price
        ):
            unit_price = sale_price

        if unit_price <= Decimal("0"):
            raise ValidationError({
                "items": (
                    f"قیمت محصول «{product.name}» معتبر نیست."
                ),
            })

        total_price += unit_price * quantity

        if total_price > max_order_total:
            raise ValidationError({
                "items": "مبلغ سفارش از حد مجاز بیشتر است.",
            })

        prepared_items.append(
            OrderItem(
                product=product,
                product_name=product.name,
                unit_price=unit_price,
                quantity=quantity,
            )
        )

    # ---------------------------------------------------------
    # 6. Determine order status
    # ---------------------------------------------------------
    order_status = Order.Status.PENDING

    if simulated_payment_result == "success":
        order_status = Order.Status.PAID
    elif simulated_payment_result == "failed":
        order_status = Order.Status.PAYMENT_FAILED

    # ---------------------------------------------------------
    # 7. Save order with an address snapshot
    # ---------------------------------------------------------
    order = Order.objects.create(
        user=user,
        status=order_status,
        recipient_name=address.recipient_name,
        recipient_phone=address.recipient_phone,
        province=address.province,
        city=address.city,
        street_address=address.street_address,
        postal_code=address.postal_code,
        total_price=total_price,
        note=note,
    )

    # ---------------------------------------------------------
    # 8. Save order items
    # ---------------------------------------------------------
    for order_item in prepared_items:
        order_item.order = order

    OrderItem.objects.bulk_create(prepared_items)

    # ---------------------------------------------------------
    # 9. Reduce stock unless the simulated payment failed
    # ---------------------------------------------------------
    if order.status != Order.Status.PAYMENT_FAILED:
        for item in items:
            product = products[item["product_id"]]

            product.stock -= item["quantity"]
            product.save(update_fields=["stock"])

    return order
