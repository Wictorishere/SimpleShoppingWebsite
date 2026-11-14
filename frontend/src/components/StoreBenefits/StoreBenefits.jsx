import "./StoreBenefits.css";

const benefits = [
  {
    id: "consultation",
    title: "مشاوره خرید به مشتریان",
    description: "از ۹ صبح تا ۱۷ عصر",
    icon: "support",
  },
  {
    id: "shipping",
    title: "ارسال سریع یا اکسپرس",
    description: "به سراسر ایران",
    icon: "rocket",
  },
  {
    id: "after-sales",
    title: "خدمات پس از فروش",
    description: "۱۰ سال",
    icon: "shield",
  },
  {
    id: "exchange",
    title: "امکان تعویض",
    description: "تا ۴۸ ساعت پس از تحویل",
    icon: "exchange",
  },
];

function BenefitIcon({ type }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {type === "support" && (
        <>
          <path d="M12 34v-7a20 20 0 0 1 40 0v7" />
          <rect x="9" y="28" width="8" height="16" rx="4" />
          <rect x="47" y="28" width="8" height="16" rx="4" />

          <path d="M22 28v9a10 10 0 0 0 20 0v-9" />
          <path d="M21 28c7 0 13-3 17-8 1 5 3 7 6 8" />
          <path d="M51 44v3a6 6 0 0 1-6 6h-9" />
          <rect x="29" y="50" width="8" height="5" rx="2.5" />
          <path d="M25 47v5M17 59l8-7M39 52l8 7" />
        </>
      )}

      {type === "rocket" && (
        <>
          <path d="M25 39c8-15 18-24 32-28-1 15-9 28-25 36Z" />
          <circle cx="43" cy="25" r="5" />
          <path d="m26 35-12 1 8-12 13-2" />
          <path d="m36 44-1 12 12-9 1-13" />
          <path d="M22 43c-7 1-10 5-11 12 7-1 11-4 12-10" />
          <path d="M18 20C8 25 5 36 10 44" />
          <path d="M42 53c8-3 14-10 15-18" />
          <path d="M11 12v6M8 15h6M53 49v6M50 52h6" />
          <path d="M27 10h.01M7 29h.01" />
        </>
      )}

      {type === "shield" && (
        <>
          <path d="M32 7c9 5 16 7 23 8-1 22-9 34-23 43C18 49 10 37 9 15c7-1 14-3 23-8Z" />
          <path d="m22 32 7 7 14-17" />
        </>
      )}

      {type === "badge" && (
        <>
          <path d="m32 7 5 4 6-1 3 6 6 2v7l4 5-4 5v7l-6 2-3 6-6-1-5 4-5-4-6 1-3-6-6-2v-7l-4-5 4-5v-7l6-2 3-6 6 1Z" />
          <circle cx="32" cy="30" r="14" strokeDasharray="1 4" />
          <path d="m25 30 5 5 10-11" />
          <path d="m20 47-4 13 10-4 6 6 3-11" />
          <path d="m44 47 4 13-10-4-3 3" />
        </>
      )}

      {type === "exchange" && (
        <>
          <path d="m10 17 22-8 22 8-22 8-22-8Z" />
          <path d="m10 47 22-8 22 8-22 8-22-8Z" />
          <path d="M10 17v6l10 4M54 17v6l-10 4" />
          <path d="M10 47v6l22 8 22-8v-6" />
          <circle cx="32" cy="34" r="13" />
          <path d="M25 33a7 7 0 0 1 12-4l2 2" />
          <path d="M39 26v5h-5" />
          <path d="M39 35a7 7 0 0 1-12 4l-2-2" />
          <path d="M25 42v-5h5" />
        </>
      )}
    </svg>
  );
}

export default function StoreBenefits() {
  return (
    <section
      className="store-benefits"
      dir="rtl"
      aria-label="مزایای خرید از فروشگاه"
    >
      <ul
        className="store-benefits__list"
        tabIndex={0}
        aria-label="خدمات فروشگاه؛ در نمایشگر کوچک افقی اسکرول کنید"
      >
        {benefits.map((benefit) => (
          <li className="store-benefits__card" key={benefit.id}>
            <span className="store-benefits__icon">
              <BenefitIcon type={benefit.icon} />
            </span>

            <div className="store-benefits__content">
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
