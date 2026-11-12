from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    AddressDetailAPIView,
    AddressListCreateAPIView,
    ProfileAPIView,
    RegisterAPIView,
    LogoutAPIView,
)

app_name = "accounts"

urlpatterns = [
    path(
        "register/",
        RegisterAPIView.as_view(),
        name="register",
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "me/",
        ProfileAPIView.as_view(),
        name="profile",
    ),
    path(
        "addresses/",
        AddressListCreateAPIView.as_view(),
        name="address_list",
    ),
    path(
        "addresses/<int:pk>/",
        AddressDetailAPIView.as_view(),
        name="address_detail",
    ),
]
