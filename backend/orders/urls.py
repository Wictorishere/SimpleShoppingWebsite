from django.urls import path

from .views import (
    OrderDetailAPIView,
    OrderListCreateAPIView,
)


app_name = "orders"

urlpatterns = [
    path(
        "",
        OrderListCreateAPIView.as_view(),
        name="order_list",
    ),
    path(
        "<int:pk>/",
        OrderDetailAPIView.as_view(),
        name="order_detail",
    ),
]
