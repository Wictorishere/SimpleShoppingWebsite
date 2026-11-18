import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import { useCart } from "../../context/CartContext";

import "./MiniCart.css";

const formatter = new Intl.NumberFormat("fa-IR");

export default function MiniCart({ onClose }) {
  const { items, removeItem } = useCart();

  const [reloadKey, setReloadKey] = useState(0);

  const [result, setResult] = useState({
    key: null,
    products: {},
  });

  const requestsKey = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      slug: item.slug ?? "",
    }))
  );

  const loadKey = JSON.stringify([requestsKey, reloadKey]);

  const loading =
    items.length > 0 && result.key !== loadKey;

  const products = result.products;

  useEffect(() => {
    const controller = new AbortController();
    const requests = JSON.parse(requestsKey);

    async function loadProducts() {
      const entries = await Promise.all(
        requests.map(async ({ productId, slug }) => {
          if (!slug) {
            return [
              productId,
              {
                error:
                  "این مورد از نسخهٔ قدیمی سبد است؛ حذفش کنید و دوباره از صفحهٔ محصول اضافه کنید.",
              },
            ];
          }

          try {
            const product = await api(
              `/api/products/${encodeURIComponent(slug)}/`,
              { signal: controller.signal }
            );

            return [productId, { product }];
          } catch (error) {
            return [
              productId,
              {
                error:
                  error.status === 404
                    ? "این محصول دیگر در دسترس نیست."
                    : "دریافت اطلاعات محصول انجام نشد.",
              },
            ];
          }
        })
      );

      if (!controller.signal.aborted) {
        setResult({
          key: loadKey,
          products: Object.fromEntries(entries),
        });
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [requestsKey, loadKey]);

  const hasError =
    !loading &&
    items.some((item) => products[item.productId]?.error);

  return (
    <section
      id="navbar-mini-cart"
      className="mini-cart"
      aria-labelledby="mini-cart-title"
      tabIndex={-1}
      dir="rtl"
    >
      <header className="mini-cart__header">
        <h2 id="mini-cart-title">سبد خرید شما</h2>

        <button
          type="button"
          className="mini-cart__close"
          onClick={onClose}
          aria-label="بستن پیش‌نمایش سبد خرید"
        >
          ×
        </button>
      </header>

      <div
        className="mini-cart__body"
        aria-busy={loading}
      >
        {!items.length ? (
          <div className="mini-cart__empty">
            <span aria-hidden="true">🛒</span>

            <p>سبد خرید شما خالی است.</p>

            <Link to="/products" onClick={onClose}>
              مشاهدهٔ محصولات
            </Link>
          </div>
        ) : loading ? (
          <div className="mini-cart__loading" role="status">
            <span
              className="mini-cart__spinner"
              aria-hidden="true"
            />

            <p>در حال دریافت اطلاعات محصولات…</p>
          </div>
        ) : (
          <ul className="mini-cart__list">
            {items.map((item) => {
              const entry = products[item.productId];
              const product = entry?.product;
              const image = product?.images?.[0]?.image;

              const unavailable =
                product &&
                (product.is_active === false ||
                  Number(product.stock) < item.quantity);

              return (
                <li
                  className="mini-cart__item"
                  key={item.productId}
                >
                  <div className="mini-cart__image">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        width="64"
                        height="64"
                      />
                    ) : (
                      <span aria-hidden="true">🛍</span>
                    )}
                  </div>

                  <div className="mini-cart__info">
                    {product ? (
                      <Link
                        className="mini-cart__name"
                        to={`/products/${encodeURIComponent(
                          product.slug
                        )}`}
                        onClick={onClose}
                      >
                        {product.name}
                      </Link>
                    ) : (
                      <p className="mini-cart__error">
                        {entry?.error ||
                          "اطلاعات محصول موجود نیست."}
                      </p>
                    )}

                    <p className="mini-cart__quantity">
                      تعداد: {formatter.format(item.quantity)}
                    </p>

                    {unavailable && (
                      <p className="mini-cart__error">
                        این تعداد از محصول در دسترس نیست.
                      </p>
                    )}

                    <button
                      type="button"
                      className="mini-cart__remove"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`حذف ${
                        product?.name || "محصول"
                      } از سبد`}
                    >
                      حذف از سبد
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="mini-cart__footer">
          {hasError && (
            <button
              type="button"
              className="mini-cart__retry"
              onClick={() =>
                setReloadKey((previous) => previous + 1)
              }
            >
              تلاش دوباره برای دریافت اطلاعات
            </button>
          )}

          <p>
            قیمت و موجودی نهایی هنگام ثبت سفارش بررسی
            می‌شوند.
          </p>

          <Link
            className="mini-cart__view-cart"
            to="/cart"
            onClick={onClose}
          >
            مشاهدهٔ سبد خرید
          </Link>
        </footer>
      )}
    </section>
  );
}
