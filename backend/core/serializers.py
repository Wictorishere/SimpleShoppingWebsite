from rest_framework import serializers

from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = (
            "name",
            "description",
            "support_phone",
            "support_email",
            "address",
            "instagram_url",
            "telegram_url",
        )
        read_only_fields = fields
