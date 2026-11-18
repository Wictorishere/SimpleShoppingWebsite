import "./Pagination.css";

const formatter = new Intl.NumberFormat("fa-IR");

function createPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) {
    end = 5;
  }

  if (currentPage >= totalPages - 2) {
    start = totalPages - 4;
  }

  const items = [1];

  if (start > 2) {
    items.push("start-gap");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("end-gap");
  }

  items.push(totalPages);

  return items;
}

export default function Pagination({
  currentPage = 1,
  totalCount = 0,
  pageSize = 12,
  onPageChange,
  loading = false,
}) {
  if (
    !Number.isFinite(totalCount) ||
    !Number.isFinite(pageSize) ||
    totalCount <= 0 ||
    pageSize <= 0
  ) {
    return null;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(
    Math.max(1, Math.trunc(currentPage) || 1),
    totalPages
  );

  const pageItems = createPageItems(safePage, totalPages);

  function selectPage(page) {
    if (
      loading ||
      page === safePage ||
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    onPageChange(page);
  }

  return (
    <nav
      className="catalog-pagination"
      aria-label="صفحه‌بندی محصولات"
      dir="rtl"
    >
      <div className="catalog-pagination__controls">
        <button
          type="button"
          className="catalog-pagination__direction"
          disabled={loading || safePage === 1}
          onClick={() => selectPage(safePage - 1)}
          aria-label="صفحهٔ قبلی"
        >
          <span aria-hidden="true">→</span>
          <span>قبلی</span>
        </button>

        <ul className="catalog-pagination__pages">
          {pageItems.map((item) => (
            <li key={item}>
              {typeof item === "number" ? (
                <button
                  type="button"
                  className={[
                    "catalog-pagination__page",
                    item === safePage
                      ? "catalog-pagination__page--active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`صفحهٔ ${formatter.format(item)}`}
                  aria-current={
                    item === safePage ? "page" : undefined
                  }
                  disabled={loading}
                  onClick={() => selectPage(item)}
                >
                  {formatter.format(item)}
                </button>
              ) : (
                <span className="catalog-pagination__ellipsis">
                  <span aria-hidden="true">…</span>
                  <span className="catalog-pagination__sr-only">
                    صفحات دیگر
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="catalog-pagination__direction"
          disabled={loading || safePage === totalPages}
          onClick={() => selectPage(safePage + 1)}
          aria-label="صفحهٔ بعدی"
        >
          <span>بعدی</span>
          <span aria-hidden="true">←</span>
        </button>
      </div>

      <p className="catalog-pagination__description">
        صفحهٔ {formatter.format(safePage)} از{" "}
        {formatter.format(totalPages)}
      </p>
    </nav>
  );
}
