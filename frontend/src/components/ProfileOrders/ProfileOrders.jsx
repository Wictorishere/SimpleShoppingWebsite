import { useEffect, useState } from "react";

import { api } from "../../api/client";
import "./ProfileOrders.css";

const number = new Intl.NumberFormat("fa-IR");

function money(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${number.format(amount)} تومان`
    : "—";
}

function dateText(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fa-IR");
}

function errorText(error) {
  function flatten(value) {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(flatten);

    if (value && typeof value === "object") {
      return Object.values(value).flatMap(flatten);
    }

    return [];
  }

  return (
    flatten(error?.data).join(" — ") ||
    error?.message ||
    "دریافت اطلاعات انجام نشد."
  );
}

function StatusBadge({ order }) {
  return (
    <span
      className="profile-orders__status"
      data-status={order.status}
    >
      {order.status_display || order.status}
    </span>
  );
}

function OrderDetails({ orderId }) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: "",
  });

  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({
      loading: true,
      data: null,
      error: "",
    });

    async function load() {
      try {
        const data = await api(`/api/orders/${orderId}/`, {
          auth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (
          !data ||
          String(data.id) !== String(orderId) ||
          !Array.isArray(data.items)
        ) {
          throw new Error("پاسخ جزئیات سفارش معتبر نیست.");
        }

        setState({
          loading: false,
          data,
          error: "",
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          loading: false,
          data: null,
          error: errorText(error),
        });
      }
    }

    load();

    return () => controller.abort();
  }, [orderId, retry]);

  if (state.loading) {
    return <p role="status">در حال دریافت جزئیات…</p>;
  }

  if (state.error) {
    return (
      <div>
        <p className="profile-orders__error" role="alert">
          {state.error}
        </p>

        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const order = state.data;

  return (
    <div className="profile-orders__details">
      <h4>اطلاعات تحویل</h4>

      <p>
        گیرنده: {order.recipient_name}
        <br />
        تلفن: <bdi>{order.recipient_phone}</bdi>
        <br />
        آدرس: {order.province}، {order.city}،{" "}
        {order.street_address}
        <br />
        کد پستی: <bdi>{order.postal_code}</bdi>
      </p>

      <h4>کالاهای سفارش</h4>

      <ul className="profile-orders__items">
        {order.items.map((item) => (
          <li key={item.id}>
            <strong>{item.product_name}</strong>

            <span>
              تعداد: {number.format(item.quantity)}
            </span>

            <span>قیمت واحد: {money(item.unit_price)}</span>

            <span>جمع: {money(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="profile-orders__note">
          توضیحات: {order.note}
        </p>
      )}

      <p>
        <strong>مبلغ کل: {money(order.total_price)}</strong>
      </p>
    </div>
  );
}

export default function ProfileOrders() {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [openedId, setOpenedId] = useState(null);

  const [state, setState] = useState({
    loading: true,
    items: [],
    hasNext: false,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    setState({
      loading: true,
      items: [],
      hasNext: false,
      error: "",
    });

    async function load() {
      try {
        const data = await api(`/api/orders/?page=${page}`, {
          auth: true,
          signal: controller.signal,
        });

        const items = Array.isArray(data) ? data : data?.results;

        if (!Array.isArray(items)) {
          throw new Error("پاسخ فهرست سفارش‌ها معتبر نیست.");
        }

        if (controller.signal.aborted) return;

        setState({
          loading: false,
          items,
          hasNext: !Array.isArray(data) && Boolean(data.next),
          error: "",
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          loading: false,
          items: [],
          hasNext: false,
          error: errorText(error),
        });
      }
    }

    load();

    return () => controller.abort();
  }, [page, reloadKey]);

  function changePage(nextPage) {
    setOpenedId(null);
    setPage(nextPage);
  }

  return (
    <section
      className="profile-orders"
      dir="rtl"
      aria-labelledby="profile-orders-title"
      aria-busy={state.loading}
    >
      <header className="profile-orders__header">
        <div>
          <h2 id="profile-orders-title">سفارش‌های من</h2>
          <p>سفارش‌ها و نتیجهٔ پرداخت‌های آزمایشی</p>
        </div>

        <button
          type="button"
          disabled={state.loading}
          onClick={() => {
            setOpenedId(null);
            setReloadKey((value) => value + 1);
          }}
        >
          به‌روزرسانی
        </button>
      </header>

      <p className="profile-orders__notice">
        این فروشگاه آزمایشی است؛ وضعیت پرداخت در این پروژه
        می‌تواند شبیه‌سازی‌شده باشد و رسید پرداخت واقعی نیست.
      </p>

      {state.loading ? (
        <p role="status">در حال دریافت سفارش‌ها…</p>
      ) : state.error ? (
        <p className="profile-orders__error" role="alert">
          {state.error}
        </p>
      ) : !state.items.length ? (
        <p>هنوز سفارشی ثبت نکرده‌اید.</p>
      ) : (
        <div className="profile-orders__list">
          {state.items.map((order) => {
            const opened = openedId === order.id;
            const detailsId = `order-details-${order.id}`;

            return (
              <article
                className="profile-orders__card"
                key={order.id}
              >
                <div className="profile-orders__row">
                  <h3>
                    سفارش شمارهٔ {number.format(order.id)}
                  </h3>

                  <StatusBadge order={order} />
                </div>

                <p>
                  تاریخ ثبت: {dateText(order.created_at)}
                </p>

                <p>مبلغ: {money(order.total_price)}</p>

                <button
                  type="button"
                  aria-expanded={opened}
                  aria-controls={detailsId}
                  onClick={() =>
                    setOpenedId(opened ? null : order.id)
                  }
                >
                  {opened ? "بستن جزئیات" : "مشاهدهٔ جزئیات"}
                </button>

                <div id={detailsId} hidden={!opened}>
                  {opened && (
                    <OrderDetails
                      key={order.id}
                      orderId={order.id}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <nav
        className="profile-orders__pagination"
        aria-label="صفحه‌بندی سفارش‌ها"
      >
        <button
          type="button"
          disabled={state.loading || page <= 1}
          onClick={() => changePage(page - 1)}
        >
          قبلی
        </button>

        <span>صفحهٔ {number.format(page)}</span>

        <button
          type="button"
          disabled={
            state.loading || Boolean(state.error) || !state.hasNext
          }
          onClick={() => changePage(page + 1)}
        >
          بعدی
        </button>
      </nav>
    </section>
  );
}
