import { useId } from "react";
import "./ProductSortBar.css";

const sortOptions = [
  { value: "-created_at", label: "جدیدترین" },
  { value: "name", label: "نام: الف تا ی" },
  { value: "", label: "پیش‌فرض" },
  { value: "price", label: "ارزان‌ترین" },
  { value: "-price", label: "گران‌ترین" },
];

const numberFormatter = new Intl.NumberFormat("fa-IR");

export default function ProductSortBar({
  ordering = "-created_at",
  onOrderingChange,
  count = 0,
  loading = false,
}) {
  const id = useId();

  return (
    <div
      className="product-sort-bar"
      dir="rtl"
      aria-busy={loading}
    >
      <div className="product-sort-bar__sorting">
        <span
          id={`${id}-label`}
          className="product-sort-bar__label"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h11M4 18h6" />
          </svg>

          مرتب‌سازی:
        </span>

        {/* گزینه‌های دسکتاپ */}
        <div
          className="product-sort-bar__options"
          role="group"
          aria-labelledby={`${id}-label`}
        >
          {sortOptions.map((option) => (
            <button
              key={option.value || "default"}
              type="button"
              className={[
                "product-sort-bar__option",
                ordering === option.value
                  ? "product-sort-bar__option--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={ordering === option.value}
              onClick={() => onOrderingChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* انتخاب‌گر موبایل */}
        <select
          className="product-sort-bar__select"
          aria-labelledby={`${id}-label`}
          value={ordering}
          onChange={(event) =>
            onOrderingChange(event.target.value)
          }
        >
          {sortOptions.map((option) => (
            <option
              key={option.value || "default"}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p
        className="product-sort-bar__count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading ? (
          "در حال دریافت محصولات…"
        ) : (
          <>
            <strong>{numberFormatter.format(count)}</strong>
            <span>محصول</span>
          </>
        )}
      </p>
    </div>
  );
}
