from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Address
from catalog.models import Category, Product

from .models import Order, OrderItem


User = get_user_model()


class OrdersAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="order_customer",
            password="Secure!TestPassword9284",
        )
        cls.other_user = User.objects.create_user(
            username="other_customer",
            password="Secure!TestPassword9284",
        )

        cls.category = Category.objects.create(
            name="لوازم جانبی",
            slug="order-accessories",
        )

        cls.product = Product.objects.create(
            category=cls.category,
            name="کیبورد",
            slug="order-keyboard",
            price=Decimal("1500000"),
            stock=5,
            is_active=True,
        )
        cls.second_product = Product.objects.create(
            category=cls.category,
            name="ماوس",
            slug="order-mouse",
            price=Decimal("500000"),
            stock=3,
            is_active=True,
        )
        cls.inactive_product = Product.objects.create(
            category=cls.category,
            name="محصول غیرفعال",
            slug="order-inactive",
            price=Decimal("100000"),
            stock=10,
            is_active=False,
        )
        cls.out_of_stock_product = Product.objects.create(
            category=cls.category,
            name="محصول ناموجود",
            slug="order-out-of-stock",
            price=Decimal("200000"),
            stock=0,
            is_active=True,
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
        self.list_url = reverse("orders:order_list")

    def authenticate(self, user=None):
        user = user if user is not None else self.user
        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )

    def detail_url(self, order_id):
        return reverse(
            "orders:order_detail",
            kwargs={"pk": order_id},
        )

    def order_data(self, **overrides):
        data = {
            "address_id": self.address.pk,
            "items": [
                {
                    "product_id": self.product.pk,
                    "quantity": 2,
                },
                {
                    "product_id": self.second_product.pk,
                    "quantity": 1,
                },
            ],
            "note": "قبل از ارسال تماس بگیرید.",
        }
        data.update(overrides)
        return data

    def post_order(self, **overrides):
        return self.client.post(
            self.list_url,
            self.order_data(**overrides),
            format="json",
        )

    def create_valid_order(self):
        self.authenticate()
        response = self.post_order()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        return Order.objects.get(pk=response.data["id"])

    def stock_snapshot(self):
        return dict(
            Product.objects.values_list("pk", "stock"),
        )

    def assert_order_rejected(self, data, error_field=None):
        order_count = Order.objects.count()
        item_count = OrderItem.objects.count()
        stocks = self.stock_snapshot()

        response = self.client.post(
            self.list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        if error_field is not None:
            self.assertIn(error_field, response.data)

        self.assertEqual(Order.objects.count(), order_count)
        self.assertEqual(OrderItem.objects.count(), item_count)
        self.assertEqual(self.stock_snapshot(), stocks)

        return response

    # Authentication

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_create_requires_authentication(self):
        response = self.post_order()

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertFalse(Order.objects.exists())

    def test_detail_requires_authentication(self):
        order = self.create_valid_order()
        self.client.credentials()

        response = self.client.get(self.detail_url(order.pk))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # Successful creation

    def test_create_order_calculates_total_and_decreases_stock(self):
        self.authenticate()

        response = self.post_order()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        order = Order.objects.get(pk=response.data["id"])

        self.assertEqual(order.user_id, self.user.pk)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.total_price, Decimal("3500000"))
        self.assertEqual(order.note, "قبل از ارسال تماس بگیرید.")
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(
            Decimal(str(response.data["total_price"])),
            Decimal("3500000"),
        )

        self.product.refresh_from_db()
        self.second_product.refresh_from_db()

        self.assertEqual(self.product.stock, 3)
        self.assertEqual(self.second_product.stock, 2)

        item = order.items.get(product=self.product)

        self.assertEqual(item.product_name, self.product.name)
        self.assertEqual(item.unit_price, Decimal("1500000"))
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.subtotal, Decimal("3000000"))

    def test_create_order_copies_shipping_address(self):
        order = self.create_valid_order()

        for field in [
            "recipient_name",
            "recipient_phone",
            "province",
            "city",
            "street_address",
            "postal_code",
        ]:
            with self.subTest(field=field):
                self.assertEqual(
                    getattr(order, field),
                    getattr(self.address, field),
                )

    def test_note_is_optional(self):
        self.authenticate()
        data = self.order_data()
        data.pop("note")

        response = self.client.post(
            self.list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        order = Order.objects.get(pk=response.data["id"])
        self.assertEqual(order.note, "")

    def test_client_cannot_override_owner_status_or_prices(self):
        self.authenticate()
        data = self.order_data()

        data.update({
            "user": self.other_user.pk,
            "status": Order.Status.PAID,
            "total_price": "1",
            "recipient_name": "گیرنده جعلی",
        })
        data["items"][0].update({
            "unit_price": "1",
            "product_name": "نام جعلی",
        })

        response = self.client.post(
            self.list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        order = Order.objects.get(pk=response.data["id"])
        item = order.items.get(product=self.product)

        self.assertEqual(order.user_id, self.user.pk)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.total_price, Decimal("3500000"))
        self.assertEqual(
            order.recipient_name,
            self.address.recipient_name,
        )
        self.assertEqual(item.unit_price, self.product.price)
        self.assertEqual(item.product_name, self.product.name)

    def test_order_can_use_all_remaining_stock(self):
        self.authenticate()

        response = self.post_order(items=[
            {
                "product_id": self.product.pk,
                "quantity": self.product.stock,
            },
        ])

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)

        # A later order must not buy the now-unavailable stock.
        self.assert_order_rejected(
            self.order_data(items=[
                {
                    "product_id": self.product.pk,
                    "quantity": 1,
                },
            ]),
            "items",
        )

    # Invalid requests must not create orders or reduce stock.

    def test_rejects_another_users_address(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(address_id=self.other_address.pk),
            "address_id",
        )

    def test_rejects_nonexistent_address(self):
        self.authenticate()
        missing_id = self.other_address.pk + 10000

        self.assert_order_rejected(
            self.order_data(address_id=missing_id),
            "address_id",
        )

    def test_rejects_missing_required_fields(self):
        self.authenticate()

        for field in ["address_id", "items"]:
            with self.subTest(field=field):
                data = self.order_data()
                data.pop(field)

                self.assert_order_rejected(data, field)

    def test_rejects_empty_items(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(items=[]),
            "items",
        )

    def test_rejects_duplicate_products(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(items=[
                {"product_id": self.product.pk, "quantity": 1},
                {"product_id": self.product.pk, "quantity": 2},
            ]),
            "items",
        )

    def test_rejects_invalid_quantities(self):
        self.authenticate()

        for quantity in [0, -1, 10001, 1.5]:
            with self.subTest(quantity=quantity):
                self.assert_order_rejected(
                    self.order_data(items=[
                        {
                            "product_id": self.product.pk,
                            "quantity": quantity,
                        },
                    ]),
                    "items",
                )

    def test_rejects_nonexistent_product(self):
        self.authenticate()
        missing_id = self.out_of_stock_product.pk + 10000

        self.assert_order_rejected(
            self.order_data(items=[
                {"product_id": missing_id, "quantity": 1},
            ]),
            "items",
        )

    def test_rejects_inactive_product(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(items=[
                {
                    "product_id": self.inactive_product.pk,
                    "quantity": 1,
                },
            ]),
            "items",
        )

    def test_rejects_out_of_stock_product(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(items=[
                {
                    "product_id": self.out_of_stock_product.pk,
                    "quantity": 1,
                },
            ]),
            "items",
        )

    def test_rejects_insufficient_stock_without_partial_changes(self):
        self.authenticate()

        # The first item is valid, but the second exceeds stock.
        self.assert_order_rejected(
            self.order_data(items=[
                {
                    "product_id": self.product.pk,
                    "quantity": 1,
                },
                {
                    "product_id": self.second_product.pk,
                    "quantity": self.second_product.stock + 1,
                },
            ]),
            "items",
        )

    def test_rejects_note_longer_than_limit(self):
        self.authenticate()

        self.assert_order_rejected(
            self.order_data(note="x" * 2001),
            "note",
        )

    # Access restrictions

    def test_list_contains_only_current_users_orders(self):
        own_order = self.create_valid_order()

        self.authenticate(self.other_user)
        response = self.post_order(
            address_id=self.other_address.pk,
            items=[
                {
                    "product_id": self.second_product.pk,
                    "quantity": 1,
                },
            ],
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        other_order_id = response.data["id"]

        self.authenticate()
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

        ids = {item["id"] for item in response.data["results"]}

        self.assertEqual(ids, {own_order.pk})
        self.assertNotIn(other_order_id, ids)

    def test_retrieve_own_order(self):
        order = self.create_valid_order()

        response = self.client.get(self.detail_url(order.pk))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], order.pk)
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(
            response.data["recipient_name"],
            self.address.recipient_name,
        )

    def test_cannot_retrieve_another_users_order(self):
        order = self.create_valid_order()
        self.authenticate(self.other_user)

        response = self.client.get(self.detail_url(order.pk))

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_order_cannot_be_updated_or_deleted_via_api(self):
        order = self.create_valid_order()
        url = self.detail_url(order.pk)
        original_total = order.total_price
        stocks = self.stock_snapshot()

        for method in ["patch", "put", "delete"]:
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    url,
                    data={"status": Order.Status.PAID},
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                )

        order.refresh_from_db()

        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.total_price, original_total)
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(self.stock_snapshot(), stocks)

    # Historical snapshots

    def test_product_changes_do_not_change_existing_order(self):
        order = self.create_valid_order()

        self.product.name = "نام جدید محصول"
        self.product.price = Decimal("2500000")
        self.product.save(update_fields=["name", "price"])

        order.refresh_from_db()
        item = order.items.get(product=self.product)

        self.assertEqual(item.product_name, "کیبورد")
        self.assertEqual(item.unit_price, Decimal("1500000"))
        self.assertEqual(item.subtotal, Decimal("3000000"))
        self.assertEqual(order.total_price, Decimal("3500000"))

    def test_address_changes_do_not_change_existing_order(self):
        order = self.create_valid_order()

        self.address.recipient_name = "گیرنده جدید"
        self.address.city = "کرج"
        self.address.street_address = "آدرس جدید"
        self.address.save(update_fields=[
            "recipient_name",
            "city",
            "street_address",
        ])

        order.refresh_from_db()

        self.assertEqual(order.recipient_name, "علی احمدی")
        self.assertEqual(order.city, "تهران")
        self.assertEqual(
            order.street_address,
            "خیابان نمونه، پلاک ۱۰",
        )

    def test_deleting_address_does_not_delete_order(self):
        order = self.create_valid_order()
        self.address.delete()

        response = self.client.get(self.detail_url(order.pk))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipient_name"], "علی احمدی")
        self.assertTrue(Order.objects.filter(pk=order.pk).exists())
        self.assertEqual(order.items.count(), 2)
