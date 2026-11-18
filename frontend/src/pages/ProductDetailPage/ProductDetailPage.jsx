import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import AddToCartButton from "../../components/AddToCartButton/AddToCartButton";

import "./ProductDetailPage.css";

const formatter = new Intl.NumberFormat("fa-IR");

export default function ProductDetailPage() {
  const { slug } = useParams();

  // با تغییر محصول، وضعیت تصاویر و درخواست قبلی ریست می‌شود.
  return <ProductDetailContent key={slug} slug={slug} />;
}

function ProductDetailContent({ slug }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError(null);
      setProduct(null);
      setSelectedIndex(0);
      setFailedImages({});

      try {
        const data = await api(
          `/api/products/${encodeURIComponent(slug)}/`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setProduct(data);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError({
            notFound: requestError.status === 404,
            message:
              requestError.status === 404
                ? "محصول موردنظر پیدا نشد."
                : "دریافت اطلاعات محصول انجام نشد. دوباره تلاش کنید.",
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [slug, reloadKey]);

  useEffect(() => {
    if (!product) return;

    const previousTitle = document.title;
    document.title = `${product.name} | فروشگاه`;

    return () => {
      document.title = previousTitle;
    };
  }, [product]);

  if (loading) {
    return (
      <main className="product-detail" dir="rtl">
        <div className="product-detail__container">
          <div className="product-detail__state" role="status">
            <span
              className="product-detail__spinner"
              aria-hidden="true"
            />
            <p>در حال دریافت اطلاعات محصول…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-detail" dir="rtl">
        <div className="product-detail__container">
          <div className="product-detail__state">
            <h1>
              {error.notFound
                ? "محصول پیدا نشد"
                : "مشکلی پیش آمده"}
            </h1>

            <p role="alert">{error.message}</p>

            <div className="product-detail__state-actions">
              {!error.notFound && (
                <button
                  type="button"
                  className="product-detail__retry"
                  onClick={() =>
                    setReloadKey((previous) => previous + 1)
                  }
                >
                  تلاش دوباره
                </button>
              )}

              <Link to="/products">
                بازگشت به محصولات
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) return null;

  const images = Array.isArray(product.images)
    ? product.images.filter((image) => image?.image)
    : [];

  const selectedImage = images[selectedIndex];

  const originalPrice = Number(product.price);
  const salePrice = Number(product.daily_sale_price);

  const validPrice =
    Number.isFinite(originalPrice) && originalPrice > 0;

  const hasDiscount =
    validPrice &&
    Number.isFinite(salePrice) &&
    salePrice > 0 &&
    salePrice < originalPrice;

  const currentPrice = hasDiscount
    ? salePrice
    : originalPrice;

  const discountPercent = hasDiscount
    ? Math.floor(
        ((originalPrice - salePrice) / originalPrice) * 100
      )
    : 0;

  const stock = Number(product.stock);

  const available =
    product.is_active !== false &&
    Number.isFinite(stock) &&
    stock >= 1;

  const categoryName =
    product.category?.name || product.category_name;

  const description =
    typeof product.description === "string"
      ? product.description.trim()
      : "";

  function markImageFailed(url) {
    setFailedImages((previous) => ({
      ...previous,
      [url]: true,
    }));
  }

  return (
    <main className="product-detail" dir="rtl">
      <div className="product-detail__container">
        <nav
          className="product-detail__breadcrumb"
          aria-label="مسیر صفحه"
        >
          <Link to="/">خانه</Link>

          <span aria-hidden="true">/</span>

          <Link to="/products">محصولات</Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail__layout">
          <section
            className="product-detail__gallery"
            aria-label="تصاویر محصول"
          >
            <div className="product-detail__main-image">
              {selectedImage &&
              !failedImages[selectedImage.image] ? (
                <img
                  key={selectedImage.image}
                  src={selectedImage.image}
                  alt={`${product.name}، تصویر ${formatter.format(
                    selectedIndex + 1
                  )}`}
                  onError={() =>
                    markImageFailed(selectedImage.image)
                  }
                />
              ) : (
                <div className="product-detail__image-placeholder">
                  <span aria-hidden="true">🛍</span>
                  <p>تصویر در دسترس نیست</p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-detail__thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id ?? `${image.image}-${index}`}
                    type="button"
                    className={`product-detail__thumbnail ${
                      selectedIndex === index
                        ? "product-detail__thumbnail--active"
                        : ""
                    }`}
                    aria-label={`نمایش تصویر ${formatter.format(
                      index + 1
                    )} از ${product.name}`}
                    aria-pressed={selectedIndex === index}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {failedImages[image.image] ? (
                      <span aria-hidden="true">🛍</span>
                    ) : (
                      <img
                        src={image.image}
                        alt=""
                        loading="lazy"
                        onError={() =>
                          markImageFailed(image.image)
                        }
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className="product-detail__info"
            aria-labelledby="product-title"
          >
            {categoryName && (
              <p className="product-detail__category">
                {categoryName}
              </p>
            )}

            <h1 id="product-title">{product.name}</h1>

            <div
              className={`product-detail__availability ${
                available
                  ? "product-detail__availability--available"
                  : "product-detail__availability--unavailable"
              }`}
            >
              <span aria-hidden="true">
                {available ? "✓" : "×"}
              </span>

              {available ? "موجود در انبار" : "ناموجود"}
            </div>

            <div className="product-detail__purchase">
              {validPrice ? (
                <div className="product-detail__price">
                  {hasDiscount && (
                    <div className="product-detail__old-price">
                      <del>
                        <span className="product-detail__sr-only">
                          قیمت قبل:
                        </span>

                        {formatter.format(originalPrice)}
                        {" تومان"}
                      </del>

                      {discountPercent > 0 && (
                        <span className="product-detail__discount">
                          {formatter.format(discountPercent)}٪ تخفیف
                        </span>
                      )}
                    </div>
                  )}

                  <p className="product-detail__current-price">
                    <span className="product-detail__sr-only">
                      قیمت:
                    </span>

                    <strong>
                      {formatter.format(currentPrice)}
                    </strong>

                    <span>تومان</span>
                  </p>
                </div>
              ) : (
                <p className="product-detail__price-unavailable">
                  قیمت محصول در دسترس نیست.
                </p>
              )}

              {validPrice && (
                <AddToCartButton
                  product={
                    available
                      ? product
                      : { ...product, stock: 0 }
                  }
                />
              )}

              <p className="product-detail__purchase-note">
                قیمت و موجودی نهایی هنگام ثبت سفارش بررسی
                می‌شوند.
              </p>
            </div>

            <Link
              className="product-detail__back"
              to="/products"
            >
              بازگشت به لیست محصولات ←
            </Link>
          </section>
        </div>

        <section
          className="product-detail__description"
          aria-labelledby="product-description-title"
        >
          <h2 id="product-description-title">
            توضیحات محصول
          </h2>

          <p>
            {description ||
              "هنوز توضیحی برای این محصول ثبت نشده است."}
          </p>
        </section>
      </div>
    </main>
  );
}
