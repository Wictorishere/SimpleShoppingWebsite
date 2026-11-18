import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(
        field_name="category__slug",
        lookup_expr="exact",
    )

    in_stock = django_filters.BooleanFilter(
        method="filter_in_stock",
    )

    min_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="gte",
        min_value=0,
    )

    max_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="lte",
        min_value=0,
    )

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock__gt=0)

        return queryset

    class Meta:
        model = Product
        fields = [
            "category",
            "in_stock",
            "min_price",
            "max_price",
        ]
