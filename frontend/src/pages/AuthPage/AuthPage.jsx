import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const { user, loading, login, register } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isRegister = mode === "register";

  const requestedPath = location.state?.from;

  const redirectTo =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    requestedPath.split(/[?#]/)[0] !== "/login"
      ? requestedPath
      : "/";

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
            username: cleanUsername,
            password,
            password_confirm: confirmPassword,
        });


        // ثبت‌نام موفق را از ورود جدا می‌کنیم؛
        // اگر ورود بعداً خطا بدهد، دوباره حساب ساخته نمی‌شود.
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setNotice(
          "حساب شما ساخته شد. اکنون با رمز عبورتان وارد شوید."
        );

        return;
      }

      await login({
        username: cleanUsername,
        password,
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.message || "ارتباط با سرور برقرار نشد."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page" role="status">
        در حال بررسی حساب کاربری…
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <section
      className="auth-page"
      dir="rtl"
      aria-labelledby="auth-title"
    >
      <div className="auth-card">
        <Link to="/" className="auth-card__back">
          ← بازگشت به فروشگاه
        </Link>

        <span className="auth-card__eyebrow">
          حساب کاربری شما
        </span>

        <h1 id="auth-title">
          {isRegister ? "ساخت حساب جدید" : "خوش آمدید"}
        </h1>

        <p className="auth-card__description">
          {isRegister
            ? "برای پیگیری سفارش‌ها و مدیریت آدرس‌ها ثبت‌نام کنید."
            : "برای ادامه، وارد حساب کاربری خود شوید."}
        </p>

        <div className="auth-card__tabs">
          <button
            type="button"
            className={!isRegister ? "is-active" : ""}
            aria-pressed={!isRegister}
            disabled={submitting}
            onClick={() => changeMode("login")}
          >
            ورود
          </button>

          <button
            type="button"
            className={isRegister ? "is-active" : ""}
            aria-pressed={isRegister}
            disabled={submitting}
            onClick={() => changeMode("register")}
          >
            ثبت‌نام
          </button>
        </div>

        {error && (
          <div className="auth-card__error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="auth-card__notice" role="status">
            {notice}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <div className="auth-form__field">
            <label htmlFor="auth-username">
              نام کاربری
            </label>

            <input
              id="auth-username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              disabled={submitting}
              required
              dir="auto"
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="auth-password">
              رمز عبور
            </label>

            <div className="auth-form__password">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  isRegister
                    ? "new-password"
                    : "current-password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={submitting}
                required
                dir="auto"
              />

              <button
                type="button"
                aria-controls="auth-password"
                aria-pressed={showPassword}
                onClick={() =>
                  setShowPassword((value) => !value)
                }
              >
                {showPassword ? "پنهان" : "نمایش"}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="auth-form__field">
              <label htmlFor="auth-confirm-password">
                تکرار رمز عبور
              </label>

              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                disabled={submitting}
                required
                dir="auto"
              />

              <small>
                رمز عبور قوی و غیرمشابه با نام کاربری انتخاب کنید.
              </small>
            </div>
          )}

          <button
            className="auth-form__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "در حال انجام…"
              : isRegister
                ? "ساخت حساب کاربری"
                : "ورود به حساب"}
          </button>
        </form>
      </div>
    </section>
  );
}
