from django.contrib import admin

from .models import StoreSettings


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
