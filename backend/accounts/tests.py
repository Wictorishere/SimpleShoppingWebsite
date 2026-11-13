from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address


User = get_user_model()


class AccountsAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.password = "Secure!TestPassword9284"

        cls.user = User.objects.create_user(
            username="customer1",
            password=cls.password,
        )
        cls.other_user = User.objects.create_user(
            username="customer2",
            password=cls.password,
            phone_number="09123456789",
        )

        cls.address = Address.objects.create(
            user=cls.user,
            title="خانه",
            recipient_name="علی احمدی",
            recipient_phone="09123456780",
            province="تهران",
            city="تهران",
            street_address="خیابان نمونه، پلاک ۱۰",
            postal_code="1234567890",
        )
        cls.other_address = Address.objects.create(
            user=cls.other_user,
            title="محل کار",
            recipient_name="رضا محمدی",
            recipient_phone="09123456789",
            province="فارس",
            city="شیراز",
            street_address="خیابان نمونه، پلاک ۲۰",
            postal_code="9876543210",
        )

    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.refresh_url = reverse("accounts:token_refresh")
        self.profile_url = reverse("accounts:profile")
        self.address_list_url = reverse("accounts:address_list")
        self.logout_url = reverse("accounts:logout")

    def authenticate(self, user=None):
        """Use real JWT authentication rather than force_authenticate."""
        user = user if user is not None else self.user
        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )
        return refresh

    def address_url(self, address):
        return reverse(
            "accounts:address_detail",
            kwargs={"pk": address.pk},
        )

    def registration_data(self, **overrides):
        data = {
            "username": "newcustomer",
            "password": self.password,
            "password_confirm": self.password,
        }
        data.update(overrides)
        return data

    def address_data(self, **overrides):
        data = {
            "title": "خانه جدید",
            "recipient_name": "پارسا احمدی",
            "recipient_phone": "09123456780",
            "province": "تهران",
            "city": "تهران",
            "street_address": "خیابان آزمایشی، پلاک ۳۰",
            "postal_code": "1234567890",
        }
        data.update(overrides)
        return data

    # Registration

    def test_register_with_minimal_fields(self):
        response = self.client.post(
            self.register_url,
            self.registration_data(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        user = User.objects.get(username="newcustomer")
        self.assertTrue(user.check_password(self.password))
        self.assertNotEqual(user.password, self.password)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertNotIn("password", response.data)
        self.assertNotIn("password_confirm", response.data)

    def test_register_rejects_duplicate_username(self):
        response = self.client.post(
            self.register_url,
            self.registration_data(username=self.user.username),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_rejects_password_mismatch(self):
        response = self.client.post(
            self.register_url,
            self.registration_data(password_confirm="Different!Password9284"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)
        self.assertFalse(
            User.objects.filter(username="newcustomer").exists(),
        )

    def test_register_requires_password_confirmation(self):
        data = self.registration_data()
        data.pop("password_confirm")

        response = self.client.post(
            self.register_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_register_rejects_weak_password(self):
        response = self.client.post(
            self.register_url,
            self.registration_data(
                password="123",
                password_confirm="123",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_register_cannot_grant_admin_permissions(self):
        response = self.client.post(
            self.register_url,
            self.registration_data(
                is_staff=True,
                is_superuser=True,
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        user = User.objects.get(username="newcustomer")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    # Login and refresh

    def test_login_returns_access_and_refresh(self):
        response = self.client.post(
            self.login_url,
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["access"])
        self.assertTrue(response.data["refresh"])

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}",
        )
        profile = self.client.get(self.profile_url)

        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["id"], self.user.pk)

    def test_login_rejects_wrong_password(self):
        response = self.client.post(
            self.login_url,
            {
                "username": self.user.username,
                "password": "Wrong!Password9284",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", response.data)

    def test_login_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(
            self.login_url,
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_returns_working_access_token(self):
        refresh = RefreshToken.for_user(self.user)

        response = self.client.post(
            self.refresh_url,
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["access"])

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}",
        )
        profile = self.client.get(self.profile_url)

        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["id"], self.user.pk)

    def test_refresh_rejects_invalid_token(self):
        response = self.client.post(
            self.refresh_url,
            {"refresh": "not-a-valid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Profile

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_own_profile(self):
        self.authenticate()

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.pk)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertNotIn("password", response.data)

    def test_patch_profile_saves_persian_text(self):
        self.authenticate()
        data = {
            "first_name": "پارسا",
            "last_name": "احمدی",
            "email": "parsa@example.com",
            "phone_number": "09123456780",
        }

        response = self.client.patch(
            self.profile_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.user.refresh_from_db()

        for field, value in data.items():
            self.assertEqual(response.data[field], value)
            self.assertEqual(getattr(self.user, field), value)

    def test_profile_cannot_change_identity_or_permissions(self):
        self.authenticate()
        original_password = self.user.password

        response = self.client.patch(
            self.profile_url,
            {
                "id": self.other_user.pk,
                "username": "renamed",
                "is_staff": True,
                "is_superuser": True,
                "password": "Replacement!Password9284",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "customer1")
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)
        self.assertEqual(self.user.password, original_password)

    def test_profile_rejects_duplicate_phone_number(self):
        self.authenticate()

        response = self.client.patch(
            self.profile_url,
            {"phone_number": self.other_user.phone_number},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_profile_rejects_invalid_phone_number(self):
        self.authenticate()

        response = self.client.patch(
            self.profile_url,
            {"phone_number": "123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_profile_allows_clearing_optional_fields(self):
        self.user.phone_number = "09123456780"
        self.user.save(update_fields=["phone_number"])
        self.authenticate()

        response = self.client.patch(
            self.profile_url,
            {
                "first_name": "",
                "last_name": "",
                "email": "",
                "phone_number": None,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.user.refresh_from_db()
        self.assertIsNone(self.user.phone_number)

    # Addresses

    def test_address_endpoints_require_authentication(self):
        detail_url = self.address_url(self.address)

        requests = [
            ("get", self.address_list_url, None),
            ("post", self.address_list_url, self.address_data()),
            ("get", detail_url, None),
            ("patch", detail_url, {"title": "تغییر"}),
            ("delete", detail_url, None),
        ]

        for method, url, data in requests:
            with self.subTest(method=method, url=url):
                response = getattr(self.client, method)(
                    url,
                    data=data,
                    format="json",
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

    def test_address_list_contains_only_own_addresses(self):
        self.authenticate()

        response = self.client.get(self.address_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Support both paginated and non-paginated responses.
        data = response.data
        results = data["results"] if isinstance(data, dict) else data

        self.assertEqual(
            {item["id"] for item in results},
            {self.address.pk},
        )

    def test_create_address_assigns_current_user(self):
        self.authenticate()

        response = self.client.post(
            self.address_list_url,
            self.address_data(user=self.other_user.pk),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        address = Address.objects.get(pk=response.data["id"])
        self.assertEqual(address.user_id, self.user.pk)
        self.assertEqual(address.recipient_name, "پارسا احمدی")

    def test_retrieve_own_address(self):
        self.authenticate()

        response = self.client.get(self.address_url(self.address))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.address.pk)

    def test_patch_address_cannot_transfer_ownership(self):
        self.authenticate()

        response = self.client.patch(
            self.address_url(self.address),
            {
                "title": "محل کار",
                "user": self.other_user.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.address.refresh_from_db()
        self.assertEqual(self.address.title, "محل کار")
        self.assertEqual(self.address.user_id, self.user.pk)

    def test_delete_own_address(self):
        self.authenticate()

        response = self.client.delete(self.address_url(self.address))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Address.objects.filter(pk=self.address.pk).exists(),
        )

    def test_cannot_access_update_or_delete_another_users_address(self):
        self.authenticate()
        url = self.address_url(self.other_address)
        original_title = self.other_address.title

        for method in ["get", "patch", "delete"]:
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    url,
                    data={"title": "تغییر غیرمجاز"},
                    format="json",
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_404_NOT_FOUND,
                )

        self.other_address.refresh_from_db()
        self.assertEqual(self.other_address.title, original_title)
        self.assertEqual(self.other_address.user_id, self.other_user.pk)

    def test_create_address_rejects_invalid_postal_code(self):
        self.authenticate()

        response = self.client.post(
            self.address_list_url,
            self.address_data(postal_code="123"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("postal_code", response.data)

    def test_create_address_rejects_invalid_recipient_phone(self):
        self.authenticate()

        response = self.client.post(
            self.address_list_url,
            self.address_data(recipient_phone="123"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recipient_phone", response.data)

    # Logout

    def test_logout_blacklists_refresh_token(self):
        refresh = self.authenticate()

        response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Refresh endpoint must reject the logged-out token.
        self.client.credentials()
        response = self.client.post(
            self.refresh_url,
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        refresh = RefreshToken.for_user(self.user)

        response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_invalid_refresh_token(self):
        self.authenticate()

        response = self.client.post(
            self.logout_url,
            {"refresh": "not-a-valid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh", response.data)

    def test_logout_requires_refresh_field(self):
        self.authenticate()

        response = self.client.post(
            self.logout_url,
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh", response.data)

    def test_logout_cannot_blacklist_another_users_refresh_token(self):
        self.authenticate()
        other_refresh = RefreshToken.for_user(self.other_user)

        response = self.client.post(
            self.logout_url,
            {"refresh": str(other_refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # The other user's token must remain usable.
        self.client.credentials()
        response = self.client.post(
            self.refresh_url,
            {"refresh": str(other_refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_rejects_already_blacklisted_refresh_token(self):
        refresh = self.authenticate()
        data = {"refresh": str(refresh)}

        first_response = self.client.post(
            self.logout_url,
            data,
            format="json",
        )
        second_response = self.client.post(
            self.logout_url,
            data,
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
