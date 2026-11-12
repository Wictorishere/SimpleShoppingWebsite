from decimal import Decimal

from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product


class CatalogAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.watches = Category.objects.create(
            name="ساعت",
            slug="watches",
        )
        cls.accessories = Category.objects.create(
            name="لوازم جانبی",
            slug="accessories",
        )

        cls.watch = Product.objects.create(
            category=cls.watches,
            name="ساعت سیتیزن",
            slug="citizen-watch",
            price=Decimal("2000000"),
            stock=3,
        )
        cls.keyboard = Product.objects.create(
            category=cls.accessories,
            name="کیبورد",
            slug="keyboard",
            price=Decimal("1000000"),
            stock=0,
        )
        cls.hidden = Product.objects.create(
            category=cls.watches,
            name="محصول غیرفعال",
            slug="hidden-product",
            price=Decimal("500000"),
            stock=1,
            is_active=False,
        )

    def test_category_list(self):
        response = self.client.get(
            reverse("catalog:category_list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_list_shows_only_active_products(self):
        response = self.client.get(
            reverse("catalog:product_list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertSetEqual(
            {item["slug"] for item in response.data["results"]},
            {"citizen-watch", "keyboard"},
        )

    def test_filter_by_category_slug(self):
        response = self.client.get(
            reverse("catalog:product_list"),
            {"category": "watches"},
        )

        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["slug"],
            "citizen-watch",
        )

    def test_search(self):
        response = self.client.get(
            reverse("catalog:product_list"),
            {"search": "سیتیزن"},
        )

        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["slug"],
            "citizen-watch",
        )

    def test_order_by_price(self):
        response = self.client.get(
            reverse("catalog:product_list"),
            {"ordering": "price"},
        )

        self.assertEqual(
            [item["slug"] for item in response.data["results"]],
            ["keyboard", "citizen-watch"],
        )

    def test_pagination(self):
        url = reverse("catalog:product_list")

        first_page = self.client.get(url, {"page_size": 1})

        self.assertEqual(first_page.data["count"], 2)
        self.assertEqual(len(first_page.data["results"]), 1)
        self.assertIsNotNone(first_page.data["next"])

        second_page = self.client.get(
            url,
            {"page_size": 1, "page": 2},
        )

        self.assertEqual(second_page.status_code, status.HTTP_200_OK)
        self.assertNotEqual(
            first_page.data["results"][0]["id"],
            second_page.data["results"][0]["id"],
        )

    def test_active_product_detail(self):
        response = self.client.get(
            reverse(
                "catalog:product_detail",
                kwargs={"slug": self.watch.slug},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], self.watch.slug)

    def test_hidden_and_missing_products_return_404(self):
        for slug in ["hidden-product", "does-not-exist"]:
            with self.subTest(slug=slug):
                response = self.client.get(
                    reverse(
                        "catalog:product_detail",
                        kwargs={"slug": slug},
                    )
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_404_NOT_FOUND,
                )

    def test_public_cannot_create_product(self):
        response = self.client.post(
            reverse("catalog:product_list"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_negative_price_is_invalid(self):
        self.watch.price = Decimal("-1")

        with self.assertRaises(ValidationError):
            self.watch.full_clean()

    def test_negative_stock_is_invalid(self):
        self.watch.stock = -1

        with self.assertRaises(ValidationError):
            self.watch.full_clean()
