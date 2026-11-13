from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False

    fields = (
        "product",
        "product_name",
        "unit_price",
        "quantity",
        "subtotal",
    )
    readonly_fields = fields

    @admin.display(description="جمع ردیف به تومان")
    def subtotal(self, obj):
        return obj.subtotal

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "recipient_name",
        "status",
        "total_price",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "=id",
        "user__username",
        "recipient_name",
        "recipient_phone",
        "postal_code",
    )

    list_select_related = ("user",)
    ordering = ("-created_at", "-id")
    date_hierarchy = "created_at"

    readonly_fields = (
        "id",
        "user",
        "status",
        "recipient_name",
        "recipient_phone",
        "province",
        "city",
        "street_address",
        "postal_code",
        "total_price",
        "note",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "اطلاعات سفارش",
            {
                "fields": (
                    "id",
                    "user",
                    "status",
                    "total_price",
                ),
            },
        ),
        (
            "اطلاعات ارسال",
            {
                "fields": (
                    "recipient_name",
                    "recipient_phone",
                    "province",
                    "city",
                    "street_address",
                    "postal_code",
                ),
            },
        ),
        (
            "سایر اطلاعات",
            {
                "fields": (
                    "note",
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    inlines = [OrderItemInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
