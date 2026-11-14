from rest_framework import serializers

from .models import StoreSettings, HeroSlide, DailyDeal


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

class HeroSlideSerializer(serializers.ModelSerializer):
    buttonText = serializers.CharField(
        source="button_text",
        read_only=True,
    )
    href = serializers.CharField(
        source="button_link",
        read_only=True,
    )
    image = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = (
            "id",
            "eyebrow",
            "title",
            "description",
            "image",
            "alt",
            "buttonText",
            "href",
        )

    def get_image(self, obj):
        return obj.image.url

class DailyDealSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    image = serializers.SerializerMethodField()

    original_price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=0,
        read_only=True,
    )

    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = DailyDeal
        fields = (
            "id",
            "name",
            "image",
            "original_price",
            "sale_price",
            "discount_percent",
        )
        read_only_fields = fields

    def get_image(self, obj):
        # اولین تصویر محصول، با رعایت ترتیب تعریف‌شده در مدل
        product_image = next(
            iter(obj.product.images.all()),
            None,
        )

        if product_image is None or not product_image.image:
            return None

        image_url = product_image.image.url
        request = self.context.get("request")

        if request is not None:
            return request.build_absolute_uri(image_url)

        return image_url

    def get_discount_percent(self, obj):
        original_price = obj.product.price

        if original_price <= 0:
            return 0

        return int(
            (original_price - obj.sale_price)
            * 100
            / original_price
        )