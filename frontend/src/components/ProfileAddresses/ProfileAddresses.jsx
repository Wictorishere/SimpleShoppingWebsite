import { useEffect, useState } from "react";

import { api } from "../../api/client";

import "./ProfileAddresses.css";

const EMPTY_FORM = {
  title: "",
  recipient_name: "",
  recipient_phone: "",
  province: "",
  city: "",
  street_address: "",
  postal_code: "",
};

const FIELDS = [
  { name: "title", label: "عنوان آدرس", placeholder: "مثلاً خانه یا محل کار" },
  { name: "recipient_name", label: "نام گیرنده" },
  {
    name: "recipient_phone",
    label: "شماره تماس گیرنده",
    type: "tel",
    dir: "ltr",
  },
  { name: "province", label: "استان" },
  { name: "city", label: "شهر" },
  {
    name: "postal_code",
    label: "کد پستی",
    inputMode: "numeric",
    dir: "ltr",
  },
  { name: "street_address", label: "آدرس کامل", multiline: true },
];

function normalizeDigits(value) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    );
}

export default function ProfileAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAddresses() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await api("/api/accounts/addresses/", {
          auth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        // پشتیبانی از پاسخ ساده و صفحه‌بندی‌شدهٔ DRF
        const items = Array.isArray(data) ? data : data?.results;

        if (!Array.isArray(items)) {
          throw new Error("پاسخ فهرست آدرس‌ها معتبر نیست.");
        }

        setAddresses(items);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setLoadError(
            requestError.message || "دریافت آدرس‌ها انجام نشد."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAddresses();

    return () => controller.abort();
  }, [reloadKey]);

  function openForm(address = null) {
    setEditingId(address?.id ?? null);

    setForm(
      Object.fromEntries(
        Object.keys(EMPTY_FORM).map((name) => [
          name,
          address?.[name] ?? "",
        ])
      )
    );

    setFieldErrors({});
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: "" }));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    const body = Object.fromEntries(
      Object.entries(form).map(([name, value]) => [
        name,
        value.trim(),
      ])
    );

    body.recipient_phone = normalizeDigits(body.recipient_phone);
    body.postal_code = normalizeDigits(body.postal_code);

    setBusy(true);
    setError("");
    setNotice("");
    setFieldErrors({});

    try {
      const isEditing = editingId !== null;

      await api(
        isEditing
          ? `/api/accounts/addresses/${editingId}/`
          : "/api/accounts/addresses/",
        {
          method: isEditing ? "PATCH" : "POST",
          auth: true,
          body,
        }
      );

      closeForm();

      setNotice(
        isEditing
          ? "آدرس با موفقیت ویرایش شد."
          : "آدرس جدید ثبت شد."
      );

      setReloadKey((previous) => previous + 1);
    } catch (requestError) {
      const errors = {};

      for (const name of Object.keys(EMPTY_FORM)) {
        const message = requestError.data?.[name];

        if (message) {
          errors[name] = Array.isArray(message)
            ? message.join(" ")
            : String(message);
        }
      }

      setFieldErrors(errors);

      setError(
        Object.keys(errors).length
          ? "لطفاً اطلاعات مشخص‌شده را اصلاح کنید."
          : requestError.message || "ذخیرهٔ آدرس انجام نشد."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteAddress(address) {
    if (busy) return;

    const confirmed = window.confirm(
      `آدرس «${address.title || "بدون عنوان"}» حذف شود؟`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api(`/api/accounts/addresses/${address.id}/`, {
        method: "DELETE",
        auth: true,
      });

      setAddresses((previous) =>
        previous.filter((item) => item.id !== address.id)
      );

      setNotice("آدرس حذف شد.");
    } catch (requestError) {
      setError(requestError.message || "حذف آدرس انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="addresses"
      aria-labelledby="addresses-title"
      aria-busy={busy || loading}
    >
      <header className="addresses__header">
        <div>
          <h2 id="addresses-title">آدرس‌های من</h2>
          <p>آدرس‌های مورد استفاده برای ارسال سفارش‌ها.</p>
        </div>

        {!formOpen && (
          <button
            className="addresses__primary"
            type="button"
            onClick={() => openForm()}
            disabled={busy || loading || Boolean(loadError)}
          >
            + آدرس جدید
          </button>
        )}
      </header>

      {notice && (
        <p className="addresses__success" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="addresses__error" role="alert">
          {error}
        </p>
      )}

      {formOpen && (
        <form className="addresses__form" onSubmit={handleSubmit}>
          <h3>
            {editingId !== null ? "ویرایش آدرس" : "افزودن آدرس"}
          </h3>

          <div className="addresses__grid">
            {FIELDS.map((field) => {
              const id = `address-${field.name}`;
              const fieldError = fieldErrors[field.name];
              const Control = field.multiline ? "textarea" : "input";

              return (
                <div
                  key={field.name}
                  className={`addresses__field ${
                    field.multiline ? "addresses__field--wide" : ""
                  }`}
                >
                  <label htmlFor={id}>{field.label}</label>

                  <Control
                    id={id}
                    name={field.name}
                    {...(!field.multiline
                      ? { type: field.type ?? "text" }
                      : { rows: 3 })}
                    dir={field.dir}
                    inputMode={field.inputMode}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={busy}
                    required
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={
                      fieldError ? `${id}-error` : undefined
                    }
                  />

                  {fieldError && (
                    <span
                      id={`${id}-error`}
                      className="addresses__field-error"
                    >
                      {fieldError}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="addresses__actions">
            <button
              type="submit"
              className="addresses__primary"
              disabled={busy}
            >
              {busy ? "در حال ذخیره…" : "ذخیرهٔ آدرس"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p role="status">در حال دریافت آدرس‌ها…</p>
      ) : loadError ? (
        <div>
          <p className="addresses__error" role="alert">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => setReloadKey((previous) => previous + 1)}
          >
            تلاش دوباره
          </button>
        </div>
      ) : !addresses.length ? (
        <p className="addresses__empty">
          هنوز آدرسی ثبت نکرده‌اید.
        </p>
      ) : (
        <div className="addresses__list">
          {addresses.map((address) => (
            <article className="address-card" key={address.id}>
              <h3>{address.title}</h3>

              <p>
                <strong>گیرنده: </strong>
                {address.recipient_name}
              </p>

              <p>
                <strong>شماره تماس: </strong>
                <bdi dir="ltr">{address.recipient_phone}</bdi>
              </p>

              <p>
                {address.province}، {address.city}
              </p>

              <p className="address-card__street">
                {address.street_address}
              </p>

              <p>
                <strong>کد پستی: </strong>
                <bdi dir="ltr">{address.postal_code}</bdi>
              </p>

              <div className="addresses__actions">
                <button
                  type="button"
                  onClick={() => openForm(address)}
                  disabled={busy || formOpen}
                  aria-label={`ویرایش آدرس ${address.title}`}
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  className="addresses__delete"
                  onClick={() => deleteAddress(address)}
                  disabled={busy || formOpen}
                  aria-label={`حذف آدرس ${address.title}`}
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
