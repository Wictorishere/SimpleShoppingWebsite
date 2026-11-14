import { useState } from "react";
import "./ProductCard.css";

const formatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

export default function ProductCard({ product, onSelect }) {
  const [failedImages, setFailedImages] = useState({});

  const imageUrls = (product.images ?? [])
    .map((item) => item.image)
    .filter(Boolean);

  const firstImage = imageUrls[0];
  const secondImage = imageUrls[1];

  const hasFirstImage = Boolean(
    firstImage && !failedImages[firstImage]
  );

  const hasSecondImage = Boolean(
    hasFirstImage &&
      secondImage &&
      secondImage !== firstImage &&
      !failedImages[secondImage]
  );

  const originalPrice = Number(product.price);
  const salePrice = Number(product.daily_sale_price);

  const available = Number(product.stock) > 0;

  const validPrice =
    product.price !== null &&
    product.price !== undefined &&
    product.price !== "" &&
    Number.isFinite(originalPrice) &&
    originalPrice >= 0;

  const hasDiscount =
    available &&
    validPrice &&
    Number.isFinite(salePrice) &&
    salePrice > 0 &&
    salePrice < originalPrice;

  const finalPrice = hasDiscount ? salePrice : originalPrice;

  const discountPercent = hasDiscount
    ? Math.floor(
        ((originalPrice - salePrice) / originalPrice) * 100
      )
    : 0;

  function markImageFailed(url) {
    setFailedImages((previous) => ({
      ...previous,
      [url]: true,
    }));
  }

  const content = (
    <>
      <div
        className={[
          "product-card__media",
          hasSecondImage
            ? "product-card__media--switchable"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {hasFirstImage ? (
          <img
            className="product-card__image product-card__image--first"
            src={firstImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => markImageFailed(firstImage)}
          />
        ) : (
          <span className="product-card__placeholder">
            تصویر موجود نیست
          </span>
        )}

        {hasSecondImage && (
          <img
            className="product-card__image product-card__image--second"
            src={secondImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => markImageFailed(secondImage)}
          />
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name" title={product.name}>
          {product.name}
        </h3>

        <div className="product-card__discount-row">
          {hasDiscount && (
            <>
              <span
                className="product-card__discount"
                aria-label={`${formatter.format(
                  discountPercent
                )} درصد تخفیف`}
              >
                {formatter.format(discountPercent)}٪
              </span>

              <del className="product-card__old-price">
                {formatter.format(originalPrice)}
              </del>
            </>
          )}
        </div>

        <div className="product-card__price-row">
          {!available ? (
            <span className="product-card__unavailable">
              ناموجود
            </span>
          ) : validPrice ? (
            <>
              <strong className="product-card__price">
                {formatter.format(finalPrice)}
              </strong>

              <span className="product-card__currency">
                تومان
              </span>
            </>
          ) : (
            <span className="product-card__unavailable">
              قیمت در دسترس نیست
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article className="product-card" dir="rtl">
      {onSelect ? (
        <button
          type="button"
          className="product-card__target"
          onClick={() => onSelect(product)}
        >
          {content}
        </button>
      ) : (
        <div className="product-card__target">
          {content}
        </div>
      )}
    </article>
  );
}
