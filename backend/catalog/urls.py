from django.urls import path

from .views import (
    CategoryListAPIView,
    ProductDetailAPIView,
    ProductListAPIView,
)


app_name = "catalog"

urlpatterns = [
    path(
        "categories/",
        CategoryListAPIView.as_view(),
        name="category_list",
    ),
    path(
        "products/",
        ProductListAPIView.as_view(),
        name="product_list",
    ),
    path(
        "products/<str:slug>/",
        ProductDetailAPIView.as_view(),
        name="product_detail",
    ),
]
