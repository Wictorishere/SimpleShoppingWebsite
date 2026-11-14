from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import F
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache

from .models import StoreSettings, HeroSlide, DailyDeal
from .serializers import StoreSettingsSerializer, HeroSlideSerializer, DailyDealSerializer


class StoreSettingsView(RetrieveAPIView):
    serializer_class = StoreSettingsSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "head", "options"]

    def get_object(self):
        settings = StoreSettings.objects.filter(pk=1).first()

        if settings is None:
            settings = StoreSettings()

        return settings


class HeroSlideListView(ListAPIView):
    serializer_class = HeroSlideSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "head", "options"]
    pagination_class = None

    def get_queryset(self):
        return HeroSlide.objects.filter(
            is_active=True
        ).order_by("position", "pk")[:4]

@method_decorator(never_cache, name="dispatch")
class DailyDealsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tehran = ZoneInfo("Asia/Tehran")
        now = timezone.now().astimezone(tehran)

        tomorrow = now.date() + timedelta(days=1)
        reset_at = datetime.combine(
            tomorrow,
            time.min,
            tzinfo=tehran,
        )

        deals = (
            DailyDeal.objects
            .select_related("product")
            .prefetch_related("product__images")
            .filter(
                is_active=True,
                product__is_active=True,
                product__stock__gt=0,
                sale_price__gt=0,
                sale_price__lt=F("product__price"),
            )
            .order_by("order", "pk")[:12]
        )

        serializer = DailyDealSerializer(
            deals,
            many=True,
            context={"request": request},
        )

        return Response({
            "server_now": now.isoformat(),
            "reset_at": reset_at.isoformat(),
            "timezone": "Asia/Tehran",
            "items": serializer.data,
        })