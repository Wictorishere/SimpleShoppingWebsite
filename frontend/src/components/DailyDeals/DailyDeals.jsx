import { useEffect, useRef, useState } from "react";
import "./DailyDeals.css";

const priceFormatter = new Intl.NumberFormat("fa-IR");

function formatPrice(value) {
  return priceFormatter.format(Number(value));
}

function formatTime(value) {
  return String(value).padStart(2, "0");
}

function Arrow({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "right" ? (
        <path d="M5 12h14m-6-6 6 6-6 6" />
      ) : (
        <path d="M19 12H5m6-6-6 6 6 6" />
      )}
    </svg>
  );
}

export default function DailyDeals() {
  const railRef = useRef(null);

  const [items, setItems] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let disposed = false;
    let refreshTimer;
    let ticker;
    let syncing = false;
    let clock = null;

    const controller = new AbortController();

    function updateClock() {
      if (!clock) return;

      // زمان سپری‌شده مستقل از تغییر ساعت دستگاه کاربر است.
      const elapsed = performance.now() - clock.receivedAt;

      const seconds = Math.max(
        0,
        Math.ceil((clock.duration - elapsed) / 1000)
      );

      setRemaining(seconds);
    }

    async function sync() {
      if (disposed || syncing) return;

      syncing = true;

      try {
        const response = await fetch("/api/core/daily-deals/", {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("دریافت حراج‌ها ناموفق بود.");
        }

        const data = await response.json();

        const serverNow = Date.parse(data.server_now);
        const resetAt = Date.parse(data.reset_at);
        const duration = resetAt - serverNow;

        if (
          !Array.isArray(data.items) ||
          !Number.isFinite(duration) ||
          duration <= 0 ||
          duration > 25 * 60 * 60 * 1000
        ) {
          throw new Error("پاسخ سرور معتبر نیست.");
        }

        if (disposed) return;

        clock = {
          duration,
          receivedAt: performance.now(),
        };

        setItems(data.items);
        setError("");
        updateClock();

        // حداکثر هر دقیقه با سرور هماهنگ می‌شویم؛
        // در نیمه‌شب نیز اطلاعات روز بعد دریافت می‌شود.
        window.clearTimeout(refreshTimer);

        refreshTimer = window.setTimeout(
          sync,
          Math.min(duration + 250, 60_000)
        );
      } catch (err) {
        if (disposed || err.name === "AbortError") return;

        setError("ارتباط با بخش حراج برقرار نشد.");

        // پس از خطا نیز خودکار دوباره تلاش می‌کنیم.
        refreshTimer = window.setTimeout(sync, 10_000);
      } finally {
        syncing = false;

        if (!disposed) {
          setLoading(false);
        }
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        window.clearTimeout(refreshTimer);
        sync();
      }
    }

    sync();
    ticker = window.setInterval(updateClock, 1000);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      disposed = true;
      controller.abort();

      window.clearTimeout(refreshTimer);
      window.clearInterval(ticker);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [retryKey]);

  function move(direction) {
    const rail = railRef.current;

    if (!rail) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    rail.scrollBy({
      // در چیدمان RTL، حرکت به اسلایدهای بعدی به سمت چپ است.
      left:
        direction === "next"
          ? -rail.clientWidth * 0.85
          : rail.clientWidth * 0.85,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const hours =
    remaining === null ? "--" : formatTime(Math.floor(remaining / 3600));

  const minutes =
    remaining === null
      ? "--"
      : formatTime(Math.floor((remaining % 3600) / 60));

  const seconds =
    remaining === null ? "--" : formatTime(remaining % 60);

  return (
    <section
      className="daily-deals"
      dir="rtl"
      aria-labelledby="daily-deals-title"
    >
      <div className="daily-deals__intro">
        <span className="daily-deals__eyebrow">
          انتخاب‌های ویژهٔ امروز
        </span>

        <h2 id="daily-deals-title">
          حراج
          <span>روزانه</span>
        </h2>

        <p className="daily-deals__description">
          فرصت دیدن قیمت‌های ویژه تا نیمه‌شب
        </p>

        <div
          className="daily-deals__timer"
          role="timer"
          aria-label={
            remaining === null
              ? "در حال دریافت زمان"
              : `${Math.floor(remaining / 3600)} ساعت و ${
                  Math.floor((remaining % 3600) / 60)
                } دقیقه و ${remaining % 60} ثانیه تا نیمه‌شب تهران`
          }
        >
          <div>
            <strong>{hours}</strong>
            <span>ساعت</span>
          </div>

          <b aria-hidden="true">:</b>

          <div>
            <strong>{minutes}</strong>
            <span>دقیقه</span>
          </div>

          <b aria-hidden="true">:</b>

          <div>
            <strong>{seconds}</strong>
            <span>ثانیه</span>
          </div>
        </div>

        <small className="daily-deals__notice">
          حراج آزمایشی؛ تایمر هر روز ساعت ۰۰:۰۰ تهران
          دوباره شروع می‌شود.
        </small>

        <div
          className="daily-deals__navigation"
          role="group"
          aria-label="حرکت بین محصولات حراج"
        >
          <button
            type="button"
            onClick={() => move("previous")}
            aria-label="محصولات قبلی"
            disabled={items.length < 2}
          >
            <Arrow direction="right" />
          </button>

          <button
            type="button"
            onClick={() => move("next")}
            aria-label="محصولات بعدی"
            disabled={items.length < 2}
          >
            <Arrow direction="left" />
          </button>
        </div>
      </div>

      <div className="daily-deals__body">
        {error && (
          <div className="daily-deals__error" role="status">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {loading && items.length === 0 ? (
          <p className="daily-deals__message" role="status">
            در حال دریافت پیشنهادهای امروز…
          </p>
        ) : items.length === 0 ? (
          <p className="daily-deals__message">
            فعلاً محصولی برای حراج ثبت نشده است.
          </p>
        ) : (
          <ul
            className="daily-deals__rail"
            ref={railRef}
            tabIndex={0}
            aria-label="محصولات حراج؛ برای مشاهدهٔ بیشتر اسکرول کنید"
          >
            {items.map((item) => (
              <li className="daily-deals__card" key={item.id}>
                <div className="daily-deals__image-wrap">
                  <span
                    className="daily-deals__badge"
                    aria-label={`${item.discount_percent} درصد تخفیف`}
                  >
                    ٪{priceFormatter.format(item.discount_percent)}
                  </span>

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="daily-deals__placeholder">
                      بدون تصویر
                    </span>
                  )}
                </div>

                <h3>{item.name}</h3>

                <div className="daily-deals__prices">
                  <del>
                    <span className="daily-deals__sr-only">
                      قیمت قبل:
                    </span>
                    {formatPrice(item.original_price)} تومان
                  </del>

                  <p>
                    <span className="daily-deals__sr-only">
                      قیمت حراج:
                    </span>

                    <strong>{formatPrice(item.sale_price)}</strong>
                    <span>تومان</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
