from django.urls import path
from .views import StoreSettingsView, HeroSlideListView, DailyDealsAPIView
from django.conf import settings
from django.conf.urls.static import static



app_name = "core"

urlpatterns = [
    path(
        "store/",
        StoreSettingsView.as_view(),
        name="store_settings",
    ),
    path(
        "slides/",
        HeroSlideListView.as_view(),
        name="hero_slides",
    ),
    path(
        "daily-deals/",
        DailyDealsAPIView.as_view(),
        name="daily-deals",
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

