from django.db import models


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
