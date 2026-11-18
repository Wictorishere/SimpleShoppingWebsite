import ProductCard from "../ProductCard/ProductCard";
import "./ProductGrid.css";

export default function ProductGrid({
  products = [],
  loading = false,
  error = "",
  onRetry,
  onSelect,
}) {
  if (loading) {
    return (
      <div className="product-grid-state" role="status" dir="rtl">
        <span
          className="product-grid-state__spinner"
          aria-hidden="true"
        />

        <p>در حال دریافت محصولات…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="product-grid-state product-grid-state--error"
        role="alert"
        dir="rtl"
      >
        <h2>دریافت محصولات انجام نشد</h2>

        <p>{error}</p>

        {onRetry && (
          <button type="button" onClick={onRetry}>
            تلاش دوباره
          </button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-grid-state" role="status" dir="rtl">
        <h2>محصولی پیدا نشد</h2>

        <p>
          عبارت جست‌وجو یا فیلترهای انتخاب‌شده را تغییر بده.
        </p>
      </div>
    );
  }

  return (
    <ul className="product-grid" dir="rtl" aria-label="محصولات">
      {products.map((product) => (
        <li key={product.id} className="product-grid__item">
          <ProductCard
            product={product}
            compact
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
