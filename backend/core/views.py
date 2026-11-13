from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import StoreSettings
from .serializers import StoreSettingsSerializer


class StoreSettingsView(RetrieveAPIView):
    serializer_class = StoreSettingsSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "head", "options"]

    def get_object(self):
        settings = StoreSettings.objects.filter(pk=1).first()

        if settings is None:
            settings = StoreSettings()

        return settings
