from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار پرداخت"
        PAID = "paid", "پرداخت‌شده"
        PROCESSING = "processing", "در حال آماده‌سازی"
        SHIPPED = "shipped", "ارسال‌شده"
        DELIVERED = "delivered", "تحویل‌شده"
        CANCELLED = "cancelled", "لغوشده"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="کاربر",
    )

    status = models.CharField(
        "وضعیت",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    recipient_name = models.CharField(
        "نام گیرنده",
        max_length=150,
    )
    recipient_phone = models.CharField(
        "شماره موبایل گیرنده",
        max_length=11,
    )
    province = models.CharField(
        "استان",
        max_length=100,
    )
    city = models.CharField(
        "شهر",
        max_length=100,
    )
    street_address = models.TextField(
        "آدرس کامل",
    )
    postal_code = models.CharField(
        "کد پستی",
        max_length=10,
    )

    total_price = models.DecimalField(
        "مبلغ کل به تومان",
        max_digits=18,
        decimal_places=0,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )

    note = models.TextField(
        "توضیحات مشتری",
        blank=True,
    )

    created_at = models.DateTimeField(
        "زمان ثبت",
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        "آخرین تغییر",
        auto_now=True,
    )

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(total_price__gte=0),
                name="orders_order_total_nonnegative",
            ),
        ]

    def __str__(self):
        return f"سفارش #{self.pk} - {self.user_id}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="سفارش",
    )

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="محصول",
    )

    product_name = models.CharField(
        "نام محصول در زمان خرید",
        max_length=200,
    )

    unit_price = models.DecimalField(
        "قیمت واحد به تومان",
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(Decimal("0"))],
    )

    quantity = models.PositiveIntegerField(
        "تعداد",
        validators=[MinValueValidator(1)],
    )

    class Meta:
        verbose_name = "قلم سفارش"
        verbose_name_plural = "اقلام سفارش"
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="orders_item_quantity_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(unit_price__gte=0),
                name="orders_item_price_nonnegative",
            ),
            models.UniqueConstraint(
                fields=["order", "product"],
                name="orders_unique_product_per_order",
            ),
        ]

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"
