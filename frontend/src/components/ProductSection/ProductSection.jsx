import { useEffect, useId, useRef, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import "./ProductSection.css";

export default function ProductSection({
  title = "جدیدترین محصولات",
  categorySlug = "",
  ordering = "-created_at",
  limit = 12,
  onSelectProduct,
}) {
  const headingId = useId();
  const trackRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");
      setProducts([]);

      try {
        const params = new URLSearchParams({ ordering });

        if (categorySlug) {
          params.set("category", categorySlug);
        }

        const response = await fetch(`/api/products/?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("دریافت محصولات ناموفق بود.");
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data.results;

        if (!Array.isArray(items)) {
          throw new Error("پاسخ محصولات معتبر نیست.");
        }

        if (!controller.signal.aborted) {
          setProducts(items.slice(0, limit));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "خطا در دریافت محصولات.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [categorySlug, ordering, limit, retry]);

  function move(direction) {
    const track = trackRef.current;
    if (!track) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ردیف RTL است؛ حرکت به سمت چپ برای محصولات بعدی.
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section
      className="product-section"
      dir="rtl"
      aria-labelledby={headingId}
      aria-busy={loading}
    >
      <header className="product-section__header">
        <h2 id={headingId}>{title}</h2>

        {!loading && !error && products.length > 0 && (
          <div className="product-section__controls">
            <button
              type="button"
              aria-label="محصولات بعدی"
              onClick={() => move(1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label="محصولات قبلی"
              onClick={() => move(-1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <p className="product-section__status" role="status">
          در حال دریافت محصولات…
        </p>
      ) : error ? (
        <div className="product-section__status" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            تلاش دوباره
          </button>
        </div>
      ) : products.length === 0 ? (
        <p className="product-section__status">محصولی پیدا نشد.</p>
      ) : (
        <ul
          ref={trackRef}
          className="product-section__track"
          tabIndex={0}
          aria-label={title}
        >
          {products.map((product) => (
            <li className="product-section__item" key={product.id}>
              <ProductCard
                product={product}
                onSelect={onSelectProduct}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
