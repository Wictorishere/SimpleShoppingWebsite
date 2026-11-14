import { useEffect, useState } from "react";
import HeroSlider from "./HeroSlider";

export default function StoreHero() {
  const [slides, setSlides] = useState([]);
  const [status, setStatus] = useState("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSlides() {
      setStatus("loading");

      try {
        const response = await fetch("/api/core/slides/", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("دریافت اسلایدها ناموفق بود.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("ساختار پاسخ معتبر نیست.");
        }

        if (controller.signal.aborted) return;

        setSlides(data);
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    }

    loadSlides();

    return () => controller.abort();
  }, [retryCount]);

  if (status === "loading") {
    return (
      <div className="store-hero-status" role="status" dir="rtl">
        در حال آماده‌سازی ویترین فروشگاه…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="store-hero-status" role="alert" dir="rtl">
        <p>دریافت تصاویر فروشگاه انجام نشد.</p>

        <button
          type="button"
          onClick={() => setRetryCount((previous) => previous + 1)}
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return <HeroSlider slides={slides} />;
}
