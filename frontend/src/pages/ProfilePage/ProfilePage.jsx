import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./ProfilePage.css";

import ProfileAddresses from "../../components/ProfileAddresses/ProfileAddresses";
import ProfileOrders from "../../components/ProfileOrders/ProfileOrders";


export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <section className="profile-page" aria-busy="true">
        <p role="status">در حال دریافت اطلاعات حساب…</p>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProfileForm key={user.id ?? user.username} />;
}

function ProfileForm() {
  const { user, updateProfile } = useAuth();

  const [values, setValues] = useState(() => ({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  }));

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username;

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSuccess("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setSuccess("");
    setError("");
    setFieldErrors({});

    try {
      const updated = await updateProfile({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      });

      setValues({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
      });

      setSuccess("اطلاعات حساب با موفقیت ذخیره شد.");
    } catch (requestError) {
      const errors = {};

      for (const name of Object.keys(values)) {
        const message = requestError.data?.[name];

        if (message) {
          errors[name] = Array.isArray(message)
            ? message.join(" ")
            : String(message);
        }
      }

      setFieldErrors(errors);

      setError(
        requestError.status === 401
          ? "نشست شما منقضی شده است؛ دوباره وارد شوید."
          : Object.keys(errors).length
            ? "لطفاً موارد مشخص‌شده را اصلاح کنید."
            : requestError.message || "ذخیرهٔ اطلاعات انجام نشد."
      );
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    {
      name: "first_name",
      label: "نام",
      type: "text",
      autoComplete: "given-name",
    },
    {
      name: "last_name",
      label: "نام خانوادگی",
      type: "text",
      autoComplete: "family-name",
    },
    {
      name: "email",
      label: "ایمیل",
      type: "email",
      autoComplete: "email",
      dir: "ltr",
    },
    {
      name: "phone",
      label: "شماره تماس",
      type: "tel",
      autoComplete: "tel",
      dir: "ltr",
    },
  ];

  return (
    <section className="profile-page" dir="rtl">
      <header className="profile-page__header">
        <div>
          <p className="profile-page__eyebrow">حساب کاربری</p>
          <h1>سلام، {displayName}</h1>
          <p>اطلاعات شخصی خود را مشاهده و ویرایش کنید.</p>
        </div>

        <Link className="profile-page__shop-link" to="/products">
          ادامهٔ خرید
        </Link>
      </header>

      <div className="profile-card">
        <div className="profile-card__heading">
          <h2>اطلاعات شخصی</h2>
          <p>نام کاربری در این بخش قابل تغییر نیست.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-form__grid">
            <div className="profile-field profile-field--wide">
              <label htmlFor="profile-username">نام کاربری</label>

              <input
                id="profile-username"
                value={user.username ?? ""}
                autoComplete="username"
                dir="ltr"
                readOnly
              />
            </div>

            {fields.map((field) => {
              const inputId = `profile-${field.name}`;
              const errorId = `${inputId}-error`;
              const fieldError = fieldErrors[field.name];

              return (
                <div className="profile-field" key={field.name}>
                  <label htmlFor={inputId}>{field.label}</label>

                  <input
                    id={inputId}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    dir={field.dir}
                    value={values[field.name]}
                    onChange={handleChange}
                    disabled={saving}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? errorId : undefined}
                  />

                  {fieldError && (
                    <span
                      id={errorId}
                      className="profile-field__error"
                    >
                      {fieldError}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="profile-message profile-message--error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="profile-message profile-message--success" role="status">
              {success}
            </p>
          )}

          <div className="profile-form__actions">
            <button type="submit" disabled={saving}>
              {saving ? "در حال ذخیره…" : "ذخیرهٔ تغییرات"}
            </button>
          </div>
        </form>
      </div>

      <ProfileAddresses />
      <ProfileOrders />
    </section>
  );
}
