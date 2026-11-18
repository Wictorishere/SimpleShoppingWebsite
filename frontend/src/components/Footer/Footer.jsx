import "./Footer.css";

function safeSocialUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function Footer({ store }) {
  const name = store?.name?.trim() || "فروشگاه";
  const description = store?.description?.trim();
  const phone = store?.support_phone?.trim();
  const email = store?.support_email?.trim();
  const address = store?.address?.trim();

  const instagram = safeSocialUrl(store?.instagram_url);
  const telegram = safeSocialUrl(store?.telegram_url);

  const phoneHref = phone
    ? `tel:${phone
        .replace(/[۰-۹]/g, (digit) =>
          String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
        )
        .replace(/[٠-٩]/g, (digit) =>
          String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
        )
        .replace(/[^\d+]/g, "")}`
    : null;

  const hasContact = Boolean(phone || email || address);
  const hasSocial = Boolean(instagram || telegram);

  const year = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    calendar: "persian",
  }).format(new Date());

  return (
    <footer
      id="contact"
      className="site-footer"
      dir="rtl"
    >
      <div className="site-footer__container">
        <div className="site-footer__main">
          <section
            className="site-footer__about"
            aria-labelledby="footer-store-name"
          >
            <h2
              id="footer-store-name"
              className="site-footer__brand"
            >
              {name}
            </h2>

            {description && (
              <p className="site-footer__description">
                {description}
              </p>
            )}

            <button
              type="button"
              className="site-footer__back-top"
              onClick={() => {
                const reduceMotion = window.matchMedia(
                  "(prefers-reduced-motion: reduce)"
                ).matches;

                window.scrollTo({
                  top: 0,
                  behavior: reduceMotion ? "auto" : "smooth",
                });
              }}
            >
              بازگشت به بالای صفحه
              <span aria-hidden="true">↑</span>
            </button>
          </section>

          {/* لینک‌های داخلی */}
          <nav
            className="site-footer__column"
            aria-label="لینک‌های فوتر"
          >
            <h3 className="site-footer__heading">
              دسترسی سریع
            </h3>

            <ul className="site-footer__links">
              <li>
                <a href="/">خانه</a>
              </li>

              <li>
                <a href="#products">محصولات</a>
              </li>

              <li>
                <a href="#categories">دسته‌بندی‌ها</a>
              </li>

              {hasContact && (
                <li>
                  <a href="#footer-contact">تماس با ما</a>
                </li>
              )}
            </ul>
          </nav>

          {/* اطلاعات تماس */}
          <section
            id="footer-contact"
            className="site-footer__column"
            aria-labelledby="footer-contact-title"
          >
            <h3
              id="footer-contact-title"
              className="site-footer__heading"
            >
              ارتباط با ما
            </h3>

            {hasContact ? (
              <address className="site-footer__contact">
                {phone && (
                  <div className="site-footer__contact-item">
                    <span className="site-footer__label">
                      تلفن پشتیبانی
                    </span>

                    <a
                      href={phoneHref}
                      className="site-footer__contact-link"
                    >
                      <bdi dir="ltr">{phone}</bdi>
                    </a>
                  </div>
                )}

                {email && (
                  <div className="site-footer__contact-item">
                    <span className="site-footer__label">
                      ایمیل
                    </span>

                    <a
                      href={`mailto:${email}`}
                      className="site-footer__contact-link"
                    >
                      <bdi dir="ltr">{email}</bdi>
                    </a>
                  </div>
                )}

                {address && (
                  <div className="site-footer__contact-item">
                    <span className="site-footer__label">
                      آدرس
                    </span>

                    <p className="site-footer__address">
                      {address}
                    </p>
                  </div>
                )}
              </address>
            ) : (
              <p className="site-footer__muted">
                اطلاعات تماس هنوز ثبت نشده است.
              </p>
            )}
          </section>

          {/* شبکه‌های اجتماعی */}
          <section
            className="site-footer__column"
            aria-labelledby="footer-social-title"
          >
            <h3
              id="footer-social-title"
              className="site-footer__heading"
            >
              همراه ما باشید
            </h3>

            <p className="site-footer__social-description">
              {hasSocial
                ? "ما را در شبکه‌های اجتماعی دنبال کنید."
                : "لینک شبکه‌های اجتماعی به‌زودی اضافه می‌شود."}
            </p>

            {hasSocial && (
              <div className="site-footer__socials">
                {instagram && (
                  <a
                    className="site-footer__social site-footer__social--instagram"
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="اینستاگرام فروشگاه — باز شدن در تب جدید"
                  >
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                      />
                      <circle cx="12" cy="12" r="4" />
                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>

                    اینستاگرام
                  </a>
                )}

                {telegram && (
                  <a
                    className="site-footer__social site-footer__social--telegram"
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تلگرام فروشگاه — باز شدن در تب جدید"
                  >
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 3 3 10l7 3 3 7 8-17Z" />
                      <path d="m10 13 5-5" />
                    </svg>

                    تلگرام
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__container site-footer__bottom-inner">
          <p>
            © {year} — تمامی حقوق این سایت متعلق به{" "}
            <strong>{name}</strong> است.
          </p>

          <span className="site-footer__bottom-note">
            همراه شما در یک خرید بهتر
          </span>
        </div>
      </div>
    </footer>
  );
}
