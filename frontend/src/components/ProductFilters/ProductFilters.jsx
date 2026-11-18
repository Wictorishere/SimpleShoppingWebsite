import { useEffect, useId, useState } from "react";
import "./ProductFilters.css";

function normalizePrice(value) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    )
    .replace(/[,\u066C\s]/g, "")
    .trim();
}

function isValidPrice(value) {
  return value === "" || /^\d+$/.test(value);
}

export default function ProductFilters({
  filters = {},
  onChange,
  onReset,
}) {
  const id = useId();

  const inStock = Boolean(filters.inStock);
  const minPrice = String(filters.minPrice ?? "");
  const maxPrice = String(filters.maxPrice ?? "");

  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    setDraftMin(minPrice);
    setDraftMax(maxPrice);
    setPriceError("");
  }, [minPrice, maxPrice]);

  function handleApplyPrice(event) {
    event.preventDefault();

    const nextMin = normalizePrice(draftMin);
    const nextMax = normalizePrice(draftMax);

    if (!isValidPrice(nextMin) || !isValidPrice(nextMax)) {
      setPriceError("قیمت را به‌صورت عدد صحیح و بدون علامت وارد کنید.");
      return;
    }

    if (
      nextMin !== "" &&
      nextMax !== "" &&
      BigInt(nextMin) > BigInt(nextMax)
    ) {
      setPriceError("حداقل قیمت نباید بیشتر از حداکثر قیمت باشد.");
      return;
    }

    setPriceError("");

    onChange({
      minPrice: nextMin,
      maxPrice: nextMax,
    });
  }

  function handleReset() {
    setDraftMin("");
    setDraftMax("");
    setPriceError("");

    onReset();
  }

  return (
    <aside
      className="product-filters"
      aria-labelledby={`${id}-heading`}
      dir="rtl"
    >
      <div className="product-filters__header">
        <h2
          id={`${id}-heading`}
          className="product-filters__heading"
        >
          فیلترها
        </h2>

        <button
          type="button"
          className="product-filters__reset"
          onClick={handleReset}
        >
          حذف فیلترها
        </button>
      </div>

      <div className="product-filters__section">
        <label className="product-filters__availability">
          <span>فقط کالاهای موجود</span>

          <input
            className="product-filters__switch-input"
            type="checkbox"
            role="switch"
            checked={inStock}
            onChange={(event) =>
              onChange({
                inStock: event.target.checked,
              })
            }
          />

          <span
            className="product-filters__switch"
            aria-hidden="true"
          />
        </label>
      </div>

      <details
        className="product-filters__group"
        open
      >
        <summary className="product-filters__summary">
          <span>بازهٔ قیمت</span>

          <svg
            className="product-filters__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>

        <form
          className="product-filters__price-form"
          onSubmit={handleApplyPrice}
        >
          <p className="product-filters__hint">
            قیمت‌ها به تومان هستند.
          </p>

          <div className="product-filters__field">
            <label htmlFor={`${id}-min-price`}>
              از قیمت
            </label>

            <div className="product-filters__input-wrap">
              <input
                id={`${id}-min-price`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="مثلاً ۱۰۰۰۰۰"
                value={draftMin}
                onChange={(event) => {
                  setDraftMin(event.target.value);
                  setPriceError("");
                }}
                aria-invalid={Boolean(priceError)}
                aria-describedby={
                  priceError ? `${id}-price-error` : undefined
                }
              />

              <span>تومان</span>
            </div>
          </div>

          <div className="product-filters__field">
            <label htmlFor={`${id}-max-price`}>
              تا قیمت
            </label>

            <div className="product-filters__input-wrap">
              <input
                id={`${id}-max-price`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="بدون محدودیت"
                value={draftMax}
                onChange={(event) => {
                  setDraftMax(event.target.value);
                  setPriceError("");
                }}
                aria-invalid={Boolean(priceError)}
                aria-describedby={
                  priceError ? `${id}-price-error` : undefined
                }
              />

              <span>تومان</span>
            </div>
          </div>

          {priceError && (
            <p
              id={`${id}-price-error`}
              className="product-filters__error"
              role="alert"
            >
              {priceError}
            </p>
          )}

          <button
            type="submit"
            className="product-filters__apply"
          >
            اعمال بازهٔ قیمت
          </button>
        </form>
      </details>

      {["برندها", "درجهٔ کیفی"].map((title) => (
        <details
          key={title}
          className="product-filters__group"
        >
          <summary className="product-filters__summary">
            <span>{title}</span>

            <span className="product-filters__test-badge">
              آزمایشی
            </span>

            <svg
              className="product-filters__chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>

          <p className="product-filters__unavailable">
            این فیلتر آزمایشی است و فعلاً در دسترس نیست.
          </p>
        </details>
      ))}
    </aside>
  );
}
