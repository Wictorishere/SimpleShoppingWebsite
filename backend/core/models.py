from django.db import models
from django.core.validators import FileExtensionValidator


class StoreSettings(models.Model):
    name = models.CharField(
        max_length=150,
        default="فروشگاه",
        verbose_name="نام فروشگاه",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="توضیحات فروشگاه",
    )
    support_phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="تلفن پشتیبانی",
    )
    support_email = models.EmailField(
        blank=True,
        default="",
        verbose_name="ایمیل پشتیبانی",
    )
    address = models.TextField(
        blank=True,
        default="",
        verbose_name="آدرس فروشگاه",
    )
    instagram_url = models.URLField(
        blank=True,
        default="",
        verbose_name="لینک اینستاگرام",
    )
    telegram_url = models.URLField(
        blank=True,
        default="",
        verbose_name="لینک تلگرام",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین ویرایش",
    )

    class Meta:
        verbose_name = "تنظیمات فروشگاه"
        verbose_name_plural = "تنظیمات فروشگاه"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(pk=1),
                name="core_store_settings_singleton",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.pk = 1

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class HeroSlide(models.Model):
    eyebrow = models.CharField(
        "متن کوتاه بالای عنوان",
        max_length=100,
        blank=True,
    )
    title = models.CharField("عنوان", max_length=160)
    description = models.TextField(
        "توضیحات",
        max_length=500,
        blank=True,
    )
    image = models.ImageField(
        "عکس",
        upload_to="hero_slides/%Y/%m/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "webp"]
            )
        ],
    )
    alt = models.CharField(
        "توضیح عکس",
        max_length=200,
        help_text="توضیح کوتاه تصویر برای دسترس‌پذیری",
    )
    button_text = models.CharField(
        "متن دکمه",
        max_length=60,
        default="مشاهده محصولات",
    )
    button_link = models.CharField(
        "لینک دکمه",
        max_length=200,
        default="#products",
        help_text="فقط لینک داخلی، مانند #products یا /products/",
    )
    position = models.PositiveSmallIntegerField(
        "ترتیب نمایش",
        default=0,
    )
    is_active = models.BooleanField("فعال", default=True)

    class Meta:
        ordering = ["position", "pk"]
        verbose_name = "اسلاید فروشگاه"
        verbose_name_plural = "اسلایدهای فروشگاه"

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()

        from django.core.exceptions import ValidationError

        errors = {}
        link = self.button_link

        if not (
            link.startswith("#")
            or (link.startswith("/") and not link.startswith("//"))
        ) or "\\" in link or any(char.isspace() for char in link):
            errors["button_link"] = "یک لینک داخلی معتبر وارد کن."

        if self.image and self.image.size > 10 * 1024 * 1024:
            errors["image"] = "حجم عکس باید حداکثر ۱۰ مگابایت باشد."

        if errors:
            raise ValidationError(errors)

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class DailyDeal(models.Model):
    product = models.OneToOneField(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="daily_deal",
        verbose_name="محصول",
    )

    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(Decimal("1"))],
        verbose_name="قیمت حراج ـ تومان",
    )

    order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال",
    )

    class Meta:
        ordering = ["order", "pk"]
        verbose_name = "محصول حراج روزانه"
        verbose_name_plural = "محصولات حراج روزانه"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(sale_price__gt=0),
                name="core_dailydeal_sale_price_gt_zero",
            ),
        ]

    def clean(self):
        super().clean()

        if (
            self.product_id
            and self.sale_price is not None
            and self.sale_price >= self.product.price
        ):
            raise ValidationError({
                "sale_price": "قیمت حراج باید کمتر از قیمت اصلی محصول باشد."
            })

    def __str__(self):
        return self.product.name