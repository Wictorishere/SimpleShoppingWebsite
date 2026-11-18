import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./CategoryGrid.css";

const categoryCards = [
  {
    key: "watch",
    title: "ساعت",
    subtitle: "زمان، به سلیقهٔ شما",
    names: ["ساعت", "ساعت مچی"],
    icon: "watch",
  },
  {
    key: "bracelet",
    title: "دستبند",
    subtitle: "ظرافتی برای هر روز",
    names: ["دستبند", "دست بند"],
    icon: "bracelet",
  },
  {
    key: "necklace",
    title: "گردنبند",
    subtitle: "جزئیاتی که می‌درخشند",
    names: ["گردنبند", "گردن بند"],
    icon: "necklace",
  },
  {
    key: "accessories",
    title: "سایر اکسسوری‌ها",
    subtitle: "تکمیل‌کنندهٔ استایل شما",
    names: ["سایر اکسسوری ها", "سایر اکسسوری", "اکسسوری"],
    icon: "accessories",
  },
];

function normalizeName(value = "") {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s\u200c\u200d]/g, "")
    .trim();
}

function CategoryIcon({ type }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "watch" && (
        <>
          <path d="M29 24l3-17h16l3 17M29 56l3 17h16l3-17" />
          <circle cx="40" cy="40" r="20" />
          <circle cx="40" cy="40" r="15" opacity=".4" />
          <path d="M40 29v12l8 5M60 35h4v10h-4" />
        </>
      )}

      {type === "bracelet" && (
        <>
          <ellipse cx="40" cy="42" rx="25" ry="23" />
          <ellipse
            cx="40"
            cy="42"
            rx="18"
            ry="16"
            opacity=".4"
          />
          <path d="M33 19l7-9 7 9-7 9-7-9Z" />
          <path d="M18 31l6 4M15 43h7M19 55l6-4" />
          <path d="M62 31l-6 4M65 43h-7M61 55l-6-4" />
        </>
      )}

      {type === "necklace" && (
        <>
          <path d="M18 13c0 25 6 39 22 43 16-4 22-18 22-43" />
          <path
            d="M24 15c0 20 4 31 16 35 12-4 16-15 16-35"
            opacity=".4"
          />
          <path d="M40 56l-9 10 9 9 9-9-9-10Z" />
          <path d="M36 66h8" />
        </>
      )}

      {type === "accessories" && (
        <>
          <circle cx="25" cy="45" r="13" />
          <circle cx="55" cy="45" r="13" />
          <path d="M38 43c1-3 3-3 4 0M12 42l-4-9M68 42l4-9" />
          <path
            d="M31 17h18M35 12h10M40 12v10"
            opacity=".5"
          />
          <path d="M60 13v10M55 18h10" />
        </>
      )}
    </svg>
  );
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/categories/", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("دریافت دسته‌بندی‌ها ناموفق بود.");
        }

        const data = await response.json();

        // پشتیبانی از پاسخ ساده و پاسخ صفحه‌بندی‌شده
        const allCategories = Array.isArray(data)
          ? data
          : data.results;

        if (!Array.isArray(allCategories)) {
          throw new Error("پاسخ دسته‌بندی‌ها معتبر نیست.");
        }

        if (!cancelled) {
          setCategories(allCategories);
        }
      } catch (err) {
        if (cancelled || err.name === "AbortError") {
          return;
        }

        setError(
          "دسته‌بندی‌ها دریافت نشدند. دوباره تلاش کنید."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryKey]);

  const cards = categoryCards.map((card) => {
    const category = categories.find((item) =>
      card.names.some(
        (name) =>
          normalizeName(name) === normalizeName(item.name)
      )
    );

    return {
      ...card,
      category,
    };
  });

  return (
    <section
      className="category-grid"
      dir="rtl"
      aria-labelledby="category-grid-title"
    >
      <header className="category-grid__header">
        <span className="category-grid__eyebrow">
          انتخاب از دنیای جزئیات
        </span>

        <h2 id="category-grid-title">
          دسته‌بندی محصولات
        </h2>

        <p>از کجا شروع می‌کنید؟</p>
      </header>

      {error ? (
        <div className="category-grid__error" role="status">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            تلاش دوباره
          </button>
        </div>
      ) : (
        <>
          {loading && (
            <p
              className="category-grid__status"
              role="status"
            >
              در حال دریافت دسته‌بندی‌ها…
            </p>
          )}

          <ul
            className="category-grid__list"
            aria-busy={loading}
          >
            {cards.map((card) => {
              const content = (
                <>
                  <span className="category-grid__icon">
                    <CategoryIcon type={card.icon} />
                  </span>

                  <span className="category-grid__name">
                    {card.title}
                  </span>

                  <span className="category-grid__subtitle">
                    {card.subtitle}
                  </span>

                  <span
                    className="category-grid__arrow"
                    aria-hidden="true"
                  >
                    ←
                  </span>
                </>
              );

              return (
                <li key={card.key}>
                  {card.category?.slug ? (
                    <Link
                      className="category-grid__card"
                      to={`/categories/${encodeURIComponent(
                        card.category.slug
                      )}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="category-grid__card category-grid__card--disabled"
                      aria-disabled="true"
                    >
                      {content}

                      {!loading && (
                        <small className="category-grid__missing">
                          {card.category
                            ? "اسلاگ دسته‌بندی ثبت نشده است"
                            : "دسته‌بندی در سایت ثبت نشده است"}
                        </small>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
