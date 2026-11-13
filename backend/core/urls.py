from django.urls import path

from .views import StoreSettingsView


app_name = "core"

urlpatterns = [
    path(
        "store/",
        StoreSettingsView.as_view(),
        name="store_settings",
    ),
]
