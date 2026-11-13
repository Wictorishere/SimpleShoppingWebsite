from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken


from .models import Address


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        label="رمز عبور",
        write_only=True,
        trim_whitespace=False,
    )

    password_confirm = serializers.CharField(
        label="تکرار رمز عبور",
        write_only=True,
        trim_whitespace=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "password_confirm",
        ]
        read_only_fields = ["id"]

        extra_kwargs = {
            "username": {
                "help_text": "",
            },
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "تکرار رمز عبور مطابقت ندارد.",
            })

        user = User(username=attrs["username"])

        try:
            validate_password(attrs["password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "password": list(exc.messages),
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")

        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )
    last_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]

        read_only_fields = [
            "id",
            "username",
        ]

        extra_kwargs = {
            "phone_number": {
                "required": False,
                "allow_blank": False,
                "allow_null": True,
            },
        }



class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "title",
            "recipient_name",
            "recipient_phone",
            "province",
            "city",
            "street_address",
            "postal_code",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        try:
            token = RefreshToken(attrs["refresh"])
        except TokenError:
            raise serializers.ValidationError({
                "refresh": "توکن نامعتبر، منقضی یا قبلاً باطل شده است.",
            })

        user = self.context["request"].user

        user_id = getattr(user, api_settings.USER_ID_FIELD)
        token_user_id = token.get(api_settings.USER_ID_CLAIM)

        if str(token_user_id) != str(user_id):
            raise serializers.ValidationError({
                "refresh": "این توکن متعلق به کاربر فعلی نیست.",
            })

        self.token = token
        return attrs

    def save(self, **kwargs):
        self.token.blacklist()
