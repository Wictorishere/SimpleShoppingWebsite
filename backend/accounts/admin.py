from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Address, User


class AddressInline(admin.StackedInline):
    model = Address
    extra = 0


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "email",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "email",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "اطلاعات فروشگاه",
            {
                "fields": (
                    "phone_number",
                    "updated_at",
                ),
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "اطلاعات فروشگاه",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "phone_number",
                ),
            },
        ),
    )

    readonly_fields = ("updated_at",)

    inlines = [AddressInline]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        "recipient_name",
        "user",
        "title",
        "province",
        "city",
        "postal_code",
    )

    list_filter = ("province", "city")

    search_fields = (
        "recipient_name",
        "recipient_phone",
        "postal_code",
        "user__username",
    )

    autocomplete_fields = ("user",)
    list_select_related = ("user",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )
