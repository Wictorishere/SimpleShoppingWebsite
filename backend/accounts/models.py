from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser


mobile_validator = RegexValidator(
    regex=r"\A09[0-9]{9}\Z",
    message="شماره موبایل باید ۱۱ رقم و با 09 شروع شود.",
)

postal_code_validator = RegexValidator(
    regex=r"\A[0-9]{10}\Z",
    message="کد پستی باید دقیقاً ۱۰ رقم باشد.",
)


class User(AbstractUser):
    first_name = models.CharField(
        "نام",
        max_length=150,
        blank=True,
    )
    last_name = models.CharField(
        "نام خانوادگی",
        max_length=150,
        blank=True,
    )
    phone_number = models.CharField(
        "شماره موبایل",
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        validators=[mobile_validator],
    )
    updated_at = models.DateTimeField(
        "آخرین ویرایش",
        auto_now=True,
    )

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self):
        return self.get_full_name() or self.username


class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
        verbose_name="کاربر",
    )
    title = models.CharField(
        "عنوان آدرس",
        max_length=50,
        blank=True,
        help_text="مثلاً خانه یا محل کار",
    )
    recipient_name = models.CharField(
        "نام و نام خانوادگی گیرنده",
        max_length=200,
    )
    recipient_phone = models.CharField(
        "شماره موبایل گیرنده",
        max_length=11,
        validators=[mobile_validator],
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
        help_text="خیابان، کوچه، پلاک و واحد",
    )
    postal_code = models.CharField(
        "کد پستی",
        max_length=10,
        validators=[postal_code_validator],
    )
    created_at = models.DateTimeField(
        "زمان ایجاد",
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        "آخرین ویرایش",
        auto_now=True,
    )

    class Meta:
        verbose_name = "آدرس"
        verbose_name_plural = "آدرس‌ها"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.recipient_name} - {self.city}"
