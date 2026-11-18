import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import "./CartPage.css";

const formatter = new Intl.NumberFormat("fa-IR");

function getUnitPrice(product) {
  const original = Number(product?.price);
  const sale = Number(product?.daily_sale_price);

  if (!Number.isSafeInteger(original) || original <= 0) {
    return null;
  }

  return Number.isSafeInteger(sale) && sale > 0 && sale < original
    ? sale
    : original;
}

function getLimit(product) {
  const stock = Number(product?.stock);

  if (
    !product ||
    product.is_active === false ||
    product.is_available === false ||
    !Number.isFinite(stock) ||
    stock < 1
  ) {
    return 0;
  }

  return Math.min(Math.floor(stock), 99);
}

function errorText(error) {
  function flatten(value) {
    if (typeof value === "string") return [value];

    if (Array.isArray(value)) {
      return value.flatMap(flatten);
    }

    if (value && typeof value === "object") {
      return Object.values(value).flatMap(flatten);
    }

    return [];
  }

  return (
    flatten(error?.data).join(" — ") ||
    error?.message ||
    "عملیات انجام نشد."
  );
}

export default function CartPage() {
  const {
    items,
    totalQuantity,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { user, loading: authLoading } = useAuth();

  const [reloadKey, setReloadKey] = useState(0);

  const [productState, setProductState] = useState({
    key: null,
    entries: {},
  });

  const [addressState, setAddressState] = useState({
    key: null,
    items: [],
    error: "",
  });

  const [addressId, setAddressId] = useState("");
  const [note, setNote] = useState("");

  const [paymentResult, setPaymentResult] = useState("success");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [order, setOrder] = useState(null);

  // اگر نتیجهٔ درخواست مشخص نباشد، جلوی ارسال مجدد را می‌گیریم.
  const [resultUnknown, setResultUnknown] = useState(false);

  const submitLock = useRef(false);

  // تغییر تعداد، نیازی به دریافت دوبارهٔ محصول ندارد.
  const productRequests = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      slug: item.slug || "",
    }))
  );

  const productKey = JSON.stringify([
    productRequests,
    reloadKey,
  ]);

  const userKey = user
    ? String(user.id ?? user.username)
    : null;

  const addressKey = userKey
    ? JSON.stringify([userKey, reloadKey])
    : null;

  // -------------------------------------------------------
  // دریافت قیمت و موجودی فعلی محصولات
  // -------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      const requests = JSON.parse(productRequests);

      const entries = await Promise.all(
        requests.map(async ({ productId, slug }) => {
          if (!slug) {
            return [
              productId,
              {
                error:
                  "اطلاعات این مورد قدیمی است؛ حذفش کنید و دوباره از صفحهٔ محصول اضافه کنید.",
              },
            ];
          }

          try {
            const product = await api(
              `/api/products/${encodeURIComponent(slug)}/`,
              {
                signal: controller.signal,
              }
            );

            if (String(product.id) !== String(productId)) {
              throw new Error(
                "اطلاعات محصول با سبد مطابقت ندارد."
              );
            }

            return [productId, { product }];
          } catch (error) {
            return [
              productId,
              {
                error:
                  error.status === 404
                    ? "این محصول دیگر در دسترس نیست."
                    : errorText(error),
              },
            ];
          }
        })
      );

      if (controller.signal.aborted) return;

      setProductState({
        key: productKey,
        entries: Object.fromEntries(entries),
      });
    }

    loadProducts();

    return () => controller.abort();
  }, [productRequests, productKey]);

  // -------------------------------------------------------
  // دریافت آدرس‌های کاربر
  // -------------------------------------------------------
  useEffect(() => {
    if (!addressKey) return;

    const controller = new AbortController();

    async function loadAddresses() {
      try {
        const data = await api("/api/accounts/addresses/", {
          auth: true,
          signal: controller.signal,
        });

        const addresses = Array.isArray(data)
          ? data
          : data?.results;

        if (!Array.isArray(addresses)) {
          throw new Error("پاسخ آدرس‌ها معتبر نیست.");
        }

        if (controller.signal.aborted) return;

        setAddressState({
          key: addressKey,
          items: addresses,
          error: "",
        });

        setAddressId((previous) =>
          addresses.some(
            (address) => String(address.id) === previous
          )
            ? previous
            : String(addresses[0]?.id || "")
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setAddressState({
          key: addressKey,
          items: [],
          error: errorText(error),
        });
      }
    }

    loadAddresses();

    return () => controller.abort();
  }, [addressKey]);

  const productsLoading =
    items.length > 0 && productState.key !== productKey;

  const addressesLoading =
    Boolean(user) && addressState.key !== addressKey;

  const addresses =
    addressKey && addressState.key === addressKey
      ? addressState.items
      : [];

  const addressError =
    addressKey && addressState.key === addressKey
      ? addressState.error
      : "";

  // -------------------------------------------------------
  // بررسی اعتبار ردیف‌های سبد
  // -------------------------------------------------------
  const rows = items.map((item) => {
    const entry = productsLoading
      ? null
      : productState.entries[item.productId];

    const product = entry?.product;
    const price = getUnitPrice(product);
    const limit = getLimit(product);

    const subtotal =
      price === null ? null : price * item.quantity;

    const validId =
      Number.isSafeInteger(Number(item.productId)) &&
      Number(item.productId) > 0;

    const valid =
      Boolean(product) &&
      !entry?.error &&
      validId &&
      price !== null &&
      Number.isSafeInteger(subtotal) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= limit;

    return {
      ...item,
      product,
      price,
      subtotal,
      limit,
      valid,
      error: entry?.error,
    };
  });

  const total = rows.reduce(
    (sum, row) => sum + (row.subtotal || 0),
    0
  );

  const uniqueProductIds = new Set(
    items.map((item) => String(item.productId))
  );

  const cartValid =
    items.length > 0 &&
    items.length <= 100 &&
    uniqueProductIds.size === items.length &&
    !productsLoading &&
    rows.every((row) => row.valid) &&
    Number.isSafeInteger(total);

  const selectedAddress = addresses.find(
    (address) => String(address.id) === addressId
  );

  const paymentResultValid =
    paymentResult === "success" || paymentResult === "failed";

  const canSubmit =
    !authLoading &&
    Boolean(user) &&
    cartValid &&
    !addressesLoading &&
    !addressError &&
    Boolean(selectedAddress) &&
    paymentResultValid &&
    !submitting &&
    !resultUnknown;

  // -------------------------------------------------------
  // ثبت سفارش و نتیجهٔ پرداخت آزمایشی
  // -------------------------------------------------------
  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit || submitLock.current) return;

    submitLock.current = true;
    setSubmitting(true);
    setSubmitError("");

    let createdOrder;

    try {
      createdOrder = await api("/api/orders/", {
        method: "POST",
        auth: true,
        body: {
          address_id: Number(selectedAddress.id),
          items: items.map((item) => ({
            product_id: Number(item.productId),
            quantity: item.quantity,
          })),
          note: note.trim(),
          simulated_payment_result: paymentResult,
        },
      });

      if (!createdOrder?.id) {
        setResultUnknown(true);
        setSubmitError(
          "پاسخ ثبت سفارش مشخص نیست. برای جلوگیری از سفارش تکراری، پیش از تلاش مجدد سفارش‌های پروفایل را بررسی کنید."
        );
        return;
      }
    } catch (error) {
      const status = Number(error.status);

      // خطای شبکه، سرور یا timeout می‌تواند نتیجهٔ نامشخص داشته باشد.
      const unknown =
        !Number.isFinite(status) ||
        status <= 0 ||
        status >= 500 ||
        status === 408;

      if (unknown) {
        setResultUnknown(true);
        setSubmitError(
          "نتیجهٔ ثبت سفارش مشخص نیست. برای جلوگیری از سفارش تکراری، پیش از تلاش مجدد سفارش‌های پروفایل را بررسی کنید."
        );
      } else {
        setSubmitError(errorText(error));
      }

      return;
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }

    setOrder(createdOrder);

    // هر دو نتیجه، یک سفارش ثبت‌شده هستند.
    // ناموفق بودن پرداخت به معنی ناموفق بودن ذخیرهٔ سفارش نیست.
    clearCart();
  }

  // -------------------------------------------------------
  // صفحهٔ نتیجه
  // -------------------------------------------------------
  if (order) {
    const paymentFailed = order.status === "payment_failed";
    const paymentSucceeded = order.status === "paid";

    return (
      <main className="cart-page" dir="rtl">
        <section className="cart-page__state" role="status">
          <h1>
            {paymentFailed
              ? "پرداخت آزمایشی ناموفق بود"
              : paymentSucceeded
                ? "پرداخت آزمایشی موفق بود"
                : "سفارش ثبت شد"}
          </h1>

          <p>
            شمارهٔ سفارش: {formatter.format(Number(order.id))}
          </p>

          {order.status_display && (
            <p>وضعیت: {order.status_display}</p>
          )}

          {order.total_price != null && (
            <p>
              مبلغ ثبت‌شده توسط سرور:{" "}
              {formatter.format(Number(order.total_price))} تومان
            </p>
          )}

          <p>
            سفارش و نتیجهٔ آن در حساب شما ذخیره شده است.
          </p>

          {paymentFailed && (
            <p>
              موجودی محصولات برای این سفارش کم نشده است.
            </p>
          )}

          <p className="cart-page__notice">
            این فرایند کاملاً آزمایشی است؛ هیچ پولی دریافت
            یا منتقل نشده است.
          </p>

          <p>
            <Link
              className="cart-page__button"
              to="/profile"
            >
              مشاهدهٔ سفارش‌ها در پروفایل
            </Link>
          </p>

          <Link to="/products">ادامهٔ خرید</Link>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------
  // صفحهٔ سبد
  // -------------------------------------------------------
  return (
    <main className="cart-page" dir="rtl">
      <header className="cart-page__heading">
        <div>
          <h1>سبد خرید</h1>

          <p>
            {formatter.format(totalQuantity)} کالا در سبد شما
          </p>
        </div>

        <Link to="/products">ادامهٔ خرید</Link>
      </header>

      {!items.length ? (
        <section className="cart-page__state">
          <h2>سبد خرید شما خالی است</h2>

          <p>
            از صفحهٔ محصولات، کالای موردنظر را انتخاب کنید.
          </p>

          <Link
            className="cart-page__button"
            to="/products"
          >
            مشاهدهٔ محصولات
          </Link>
        </section>
      ) : (
        <div className="cart-page__layout">
          <section
            className="cart-page__products"
            aria-label="کالاهای سبد خرید"
            aria-busy={productsLoading}
          >
            <div className="cart-page__toolbar">
              <h2>کالاها</h2>

              <button
                type="button"
                className="cart-page__text-button"
                disabled={submitting || productsLoading}
                onClick={() => {
                  setSubmitError("");
                  setReloadKey((value) => value + 1);
                }}
              >
                به‌روزرسانی اطلاعات
              </button>
            </div>

            {productsLoading ? (
              <p
                className="cart-page__loading"
                role="status"
              >
                در حال دریافت قیمت و موجودی…
              </p>
            ) : (
              <ul className="cart-page__list">
                {rows.map((row) => {
                  const image =
                    row.product?.images?.[0]?.image;

                  return (
                    <li
                      className="cart-page__item"
                      key={row.productId}
                    >
                      <div className="cart-page__image">
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            width="96"
                            height="96"
                          />
                        ) : (
                          <span aria-hidden="true">🛍</span>
                        )}
                      </div>

                      <div className="cart-page__item-content">
                        {row.product ? (
                          <Link
                            className="cart-page__product-name"
                            to={`/products/${encodeURIComponent(
                              row.product.slug
                            )}`}
                          >
                            {row.product.name}
                          </Link>
                        ) : (
                          <p className="cart-page__error">
                            {row.error ||
                              "اطلاعات محصول در دسترس نیست."}
                          </p>
                        )}

                        {row.price !== null && (
                          <p className="cart-page__muted">
                            قیمت واحد:{" "}
                            {formatter.format(row.price)} تومان
                          </p>
                        )}

                        {row.product && !row.valid && (
                          <p className="cart-page__error">
                            {row.limit === 0
                              ? "این محصول در حال حاضر قابل خرید نیست."
                              : row.quantity > row.limit
                                ? `تعداد مجاز فعلی: ${formatter.format(
                                    row.limit
                                  )} عدد؛ تعداد را کاهش دهید.`
                                : "اطلاعات محصول برای ثبت سفارش معتبر نیست."}
                          </p>
                        )}

                        <div className="cart-page__item-actions">
                          <div
                            className="cart-page__quantity"
                            role="group"
                            aria-label={`تعداد ${
                              row.product?.name || "محصول"
                            }`}
                          >
                            <button
                              type="button"
                              aria-label="افزایش تعداد"
                              disabled={
                                submitting ||
                                !row.product ||
                                row.quantity >= row.limit
                              }
                              onClick={() => {
                                setSubmitError("");

                                setQuantity(
                                  row.productId,
                                  row.quantity + 1,
                                  row.product.stock
                                );
                              }}
                            >
                              +
                            </button>

                            <span aria-live="polite">
                              {formatter.format(row.quantity)}
                            </span>

                            <button
                              type="button"
                              aria-label="کاهش تعداد"
                              disabled={
                                submitting ||
                                !row.product ||
                                row.quantity <= 1 ||
                                row.limit === 0
                              }
                              onClick={() => {
                                setSubmitError("");

                                setQuantity(
                                  row.productId,
                                  row.quantity - 1,
                                  row.product.stock
                                );
                              }}
                            >
                              −
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-page__remove"
                            disabled={submitting}
                            onClick={() => {
                              setSubmitError("");
                              removeItem(row.productId);
                            }}
                            aria-label={`حذف ${
                              row.product?.name || "محصول"
                            } از سبد`}
                          >
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="cart-page__subtotal">
                        {row.subtotal !== null && (
                          <>
                            <strong>
                              {formatter.format(row.subtotal)}
                            </strong>

                            <span>تومان</span>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="cart-page__summary">
            <h2>خلاصهٔ سفارش</h2>

            <div className="cart-page__total">
              <span>جمع کالاها</span>

              <strong>
                {cartValid
                  ? `${formatter.format(total)} تومان`
                  : "در انتظار بررسی سبد"}
              </strong>
            </div>

            <p className="cart-page__muted">
              مبلغ بالا برآورد فعلی است. قیمت و موجودی نهایی
              هنگام ثبت سفارش توسط سرور بررسی می‌شوند.
            </p>

            {!productsLoading && !cartValid && (
              <p
                className="cart-page__error"
                role="alert"
              >
                موارد نامعتبر یا تکراری سبد را اصلاح یا حذف
                کنید. حداکثر ۱۰۰ نوع محصول مجاز است.
              </p>
            )}

            {authLoading ? (
              <p role="status">در حال بررسی حساب…</p>
            ) : !user ? (
              <div className="cart-page__login">
                <p>
                  برای ثبت سفارش وارد حساب خود شوید.
                </p>

                <Link
                  className="cart-page__button"
                  to="/login"
                  state={{ from: "/cart" }}
                >
                  ورود / ثبت‌نام
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <fieldset disabled={submitting}>
                  <legend>آدرس تحویل</legend>

                  {addressesLoading ? (
                    <p role="status">
                      در حال دریافت آدرس‌ها…
                    </p>
                  ) : addressError ? (
                    <div>
                      <p
                        className="cart-page__error"
                        role="alert"
                      >
                        {addressError}
                      </p>

                      <button
                        type="button"
                        className="cart-page__text-button"
                        onClick={() =>
                          setReloadKey((value) => value + 1)
                        }
                      >
                        دریافت دوبارهٔ آدرس‌ها
                      </button>
                    </div>
                  ) : !addresses.length ? (
                    <p>
                      ابتدا در پروفایل یک آدرس اضافه کنید.
                    </p>
                  ) : (
                    <>
                      <label htmlFor="cart-address">
                        انتخاب آدرس
                      </label>

                      <select
                        id="cart-address"
                        value={addressId}
                        onChange={(event) => {
                          setAddressId(event.target.value);
                          setSubmitError("");
                        }}
                        required
                      >
                        {addresses.map((address) => (
                          <option
                            key={address.id}
                            value={address.id}
                          >
                            {address.recipient_name} —{" "}
                            {address.city}
                          </option>
                        ))}
                      </select>

                      {selectedAddress && (
                        <p className="cart-page__address">
                          {selectedAddress.province}،{" "}
                          {selectedAddress.city}،{" "}
                          {selectedAddress.street_address}
                          <br />
                          کد پستی:{" "}
                          <bdi>
                            {selectedAddress.postal_code}
                          </bdi>
                        </p>
                      )}
                    </>
                  )}

                  <Link
                    className="cart-page__profile-link"
                    to="/profile"
                  >
                    مدیریت آدرس‌ها
                  </Link>

                  <label htmlFor="cart-note">
                    توضیحات سفارش ـ اختیاری
                  </label>

                  <textarea
                    id="cart-note"
                    rows={3}
                    maxLength={2000}
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    placeholder="توضیحی برای ارسال سفارش…"
                  />
                </fieldset>

                <fieldset
                  className="cart-page__payment"
                  disabled={submitting}
                >
                  <legend>نتیجهٔ پرداخت آزمایشی</legend>

                  <p
                    id="cart-payment-help"
                    className="cart-page__notice"
                  >
                    فقط برای تست: نتیجه را خودتان انتخاب
                    کنید. هیچ پرداخت واقعی انجام نمی‌شود.
                  </p>

                  <label
                    className="cart-page__payment-option"
                    htmlFor="cart-payment-success"
                  >
                    <input
                      id="cart-payment-success"
                      type="radio"
                      name="simulated-payment"
                      value="success"
                      checked={paymentResult === "success"}
                      aria-describedby="cart-payment-help"
                      onChange={() => {
                        setPaymentResult("success");
                        setSubmitError("");
                      }}
                    />

                    <span>پرداخت موفق آزمایشی</span>
                  </label>

                  <label
                    className="cart-page__payment-option"
                    htmlFor="cart-payment-failed"
                  >
                    <input
                      id="cart-payment-failed"
                      type="radio"
                      name="simulated-payment"
                      value="failed"
                      checked={paymentResult === "failed"}
                      aria-describedby="cart-payment-help"
                      onChange={() => {
                        setPaymentResult("failed");
                        setSubmitError("");
                      }}
                    />

                    <span>پرداخت ناموفق آزمایشی</span>
                  </label>

                  <p className="cart-page__muted">
                    {paymentResult === "success"
                      ? "سفارش با وضعیت پرداخت‌شده ذخیره می‌شود و موجودی کاهش می‌یابد."
                      : "سفارش با وضعیت پرداخت ناموفق ذخیره می‌شود و موجودی تغییر نمی‌کند."}
                  </p>
                </fieldset>

                {submitError && (
                  <p
                    className="cart-page__error"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}

                {resultUnknown && (
                  <p className="cart-page__notice" role="alert">
                    ارسال مجدد در این صفحه متوقف شده است.
                    ابتدا{" "}
                    <Link to="/profile">
                      سفارش‌های پروفایل
                    </Link>{" "}
                    را بررسی کنید؛ بارگذاری دوبارهٔ صفحه
                    به‌تنهایی مشخص نمی‌کند سفارش ثبت شده
                    است یا نه.
                  </p>
                )}

                <button
                  type="submit"
                  className="cart-page__button"
                  disabled={!canSubmit}
                >
                  {submitting
                    ? "در حال ثبت نتیجهٔ آزمایشی…"
                    : "ثبت سفارش و نتیجهٔ پرداخت آزمایشی"}
                </button>

                <p className="cart-page__notice">
                  این سایت آزمایشی است. سفارش موفق یا
                  ناموفق در پروفایل ذخیره می‌شود و پس از
                  ثبت سفارش، سبد خرید پاک خواهد شد.
                </p>
              </form>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
