from django.db.models import OuterRef, Subquery

from core.models import DailyDeal


def with_daily_sale_price(queryset):
    active_deals = (
        DailyDeal.objects
        .filter(
            product_id=OuterRef("pk"),
            is_active=True,
            product__is_active=True,
            product__stock__gt=0,
            sale_price__gt=0,
            sale_price__lt=OuterRef("price"),
        )
        .order_by("sale_price", "pk")
    )

    return queryset.annotate(
        daily_sale_price=Subquery(
            active_deals.values("sale_price")[:1]
        )
    )
