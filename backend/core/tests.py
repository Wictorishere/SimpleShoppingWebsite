from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import RequestFactory, TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from .models import StoreSettings


User = get_user_model()


class StoreSettingsAPITests(APITestCase):
    def setUp(self):
        self.url = reverse("core:store_settings")

    def create_settings(self):
        return StoreSettings.objects.create(
            name="فروشگاه تست",
            description="توضیحات فروشگاه",
            support_phone="02112345678",
            support_email="support@example.com",
            address="تهران، خیابان نمونه",
            instagram_url="https://www.instagram.com/example/",
            telegram_url="https://t.me/example",
        )

    def test_anonymous_user_can_read_store_settings(self):
        settings = self.create_settings()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "name": settings.name,
                "description": settings.description,
                "support_phone": settings.support_phone,
                "support_email": settings.support_email,
                "address": settings.address,
                "instagram_url": settings.instagram_url,
                "telegram_url": settings.telegram_url,
            },
        )

    def test_missing_settings_returns_defaults_without_creating_row(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "فروشگاه")
        self.assertEqual(response.data["support_phone"], "")
        self.assertEqual(response.data["support_email"], "")
        self.assertFalse(StoreSettings.objects.exists())

    def test_anonymous_user_cannot_write_settings(self):
        settings = self.create_settings()

        for method in ["post", "put", "patch", "delete"]:
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    self.url,
                    data={"name": "نام تغییرکرده"},
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                )

        settings.refresh_from_db()

        self.assertEqual(settings.name, "فروشگاه تست")
        self.assertEqual(StoreSettings.objects.count(), 1)

    def test_even_superuser_cannot_write_through_public_api(self):
        user = User.objects.create_superuser(
            username="core_admin",
            password="Secure!TestPassword9284",
            email="admin@example.com",
        )
        self.client.force_authenticate(user=user)
        settings = self.create_settings()

        for method in ["post", "put", "patch", "delete"]:
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    self.url,
                    data={"name": "نام تغییرکرده"},
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                )

        settings.refresh_from_db()
        self.assertEqual(settings.name, "فروشگاه تست")


class StoreSettingsModelTests(TestCase):
    def test_settings_uses_fixed_primary_key(self):
        settings = StoreSettings.objects.create(name="فروشگاه تست")

        self.assertEqual(settings.pk, 1)

    def test_database_rejects_a_different_primary_key(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                StoreSettings.objects.create(
                    pk=2,
                    name="تنظیمات دوم",
                )

        self.assertFalse(StoreSettings.objects.exists())

    def test_cannot_create_a_second_settings_row(self):
        StoreSettings.objects.create(name="فروشگاه اول")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                StoreSettings.objects.create(name="فروشگاه دوم")

        self.assertEqual(StoreSettings.objects.count(), 1)
        self.assertEqual(
            StoreSettings.objects.get(pk=1).name,
            "فروشگاه اول",
        )


class StoreSettingsAdminTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(
            username="settings_admin",
            password="Secure!TestPassword9284",
            email="admin@example.com",
        )
        self.request = RequestFactory().get("/admin/")
        self.request.user = self.user
        self.model_admin = admin.site._registry[StoreSettings]

    def test_superuser_can_add_settings_when_none_exist(self):
        self.assertTrue(
            self.model_admin.has_add_permission(self.request),
        )

    def test_superuser_cannot_add_second_settings(self):
        StoreSettings.objects.create(name="فروشگاه تست")

        self.assertFalse(
            self.model_admin.has_add_permission(self.request),
        )

    def test_superuser_can_change_settings(self):
        settings = StoreSettings.objects.create(name="فروشگاه تست")

        self.assertTrue(
            self.model_admin.has_change_permission(
                self.request,
                settings,
            ),
        )

    def test_settings_cannot_be_deleted_from_admin(self):
        settings = StoreSettings.objects.create(name="فروشگاه تست")

        self.assertFalse(
            self.model_admin.has_delete_permission(
                self.request,
                settings,
            ),
        )
