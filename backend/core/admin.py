from django.contrib import admin

from .models import StoreSettings, HeroSlide, DailyDeal


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "support_phone",
        "support_email",
        "updated_at",
    )
    readonly_fields = ("updated_at",)

    fieldsets = (
        (
            "اطلاعات اصلی",
            {
                "fields": (
                    "name",
                    "description",
                ),
            },
        ),
        (
            "راه‌های ارتباطی",
            {
                "fields": (
                    "support_phone",
                    "support_email",
                    "address",
                ),
            },
        ),
        (
            "شبکه‌های اجتماعی",
            {
                "fields": (
                    "instagram_url",
                    "telegram_url",
                ),
            },
        ),
        (
            "اطلاعات سیستمی",
            {
                "fields": ("updated_at",),
            },
        ),
    )

    def has_add_permission(self, request):
        return (
            super().has_add_permission(request)
            and not StoreSettings.objects.exists()
        )

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ("title", "position", "is_active")
    list_editable = ("position", "is_active")
    list_filter = ("is_active",)
    search_fields = ("title", "description")
    ordering = ("position", "pk")

    fields = (
        "eyebrow",
        "title",
        "description",
        "image",
        "alt",
        "button_text",
        "button_link",
        "position",
        "is_active",
    )


@admin.register(DailyDeal)
class DailyDealAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "sale_price",
        "order",
        "is_active",
    )
    list_editable = ("order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("product__name",)
    list_select_related = ("product",)
    autocomplete_fields = ("product",)
