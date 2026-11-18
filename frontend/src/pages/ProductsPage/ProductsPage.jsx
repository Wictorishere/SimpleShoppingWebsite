import { useEffect, useRef, useState } from "react";

import ProductFilters from "../../components/ProductFilters/ProductFilters";
import ProductSortBar from "../../components/ProductSortBar/ProductSortBar";
import ProductGrid from "../../components/ProductGrid/ProductGrid";
import Pagination from "../../components/Pagination/Pagination";

import "./ProductsPage.css";

const PAGE_SIZE = 12;

function createInitialQuery() {
  return {
    page: 1,
    ordering: "-created_at",
    filters: {
      inStock: false,
      minPrice: "",
      maxPrice: "",
    },
  };
}

/*
 * با تغییر جست‌وجو یا دسته‌بندی، کامپوننت داخلی از نو ساخته می‌شود.
 * بنابراین صفحه، فیلترها و مرتب‌سازی به حالت اولیه برمی‌گردند.
 */
export default function ProductsPage({
  categorySlug = "",
  categoryName = "",
  search = "",
  onSelect,
}) {
  const normalizedCategory = String(categorySlug ?? "").trim();
  const normalizedSearch = String(search ?? "").trim();

  return (
    <ProductsPageContent
      key={JSON.stringify([
        normalizedCategory,
        normalizedSearch,
      ])}
      categorySlug={normalizedCategory}
      categoryName={categoryName}
      search={normalizedSearch}
      onSelect={onSelect}
    />
  );
}

function ProductsPageContent({
  categorySlug,
  categoryName,
  search,
  onSelect,
}) {
  const [query, setQuery] = useState(createInitialQuery);

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const resultsRef = useRef(null);

  const { page, ordering, filters } = query;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });

      if (ordering) {
        params.set("ordering", ordering);
      }

      if (categorySlug) {
        params.set("category", categorySlug);
      }

      if (search) {
        params.set("search", search);
      }

      if (filters.inStock) {
        params.set("in_stock", "true");
      }

      if (filters.minPrice !== "") {
        params.set("min_price", filters.minPrice);
      }

      if (filters.maxPrice !== "") {
        params.set("max_price", filters.maxPrice);
      }

      try {
        const response = await fetch(
          `/api/products/?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        // اگر صفحه‌ای پس از تغییر موجودی محصولات حذف شده باشد،
        // به صفحهٔ اول برمی‌گردیم.
        if (response.status === 404 && page > 1) {
          if (active) {
            setQuery((previous) => ({
              ...previous,
              page: 1,
            }));
          }

          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (
          !Array.isArray(data.results) ||
          !Number.isInteger(data.count) ||
          data.count < 0
        ) {
          throw new Error("Invalid paginated response");
        }

        if (!active) {
          return;
        }

        setProducts(data.results);
        setTotalCount(data.count);
      } catch (requestError) {
        if (
          !active ||
          requestError.name === "AbortError"
        ) {
          return;
        }

        setProducts([]);
        setTotalCount(0);

        setError(
          "دریافت اطلاعات ناموفق بود. اتصال اینترنت و در دسترس بودن سرور را بررسی کن."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    page,
    ordering,
    filters.inStock,
    filters.minPrice,
    filters.maxPrice,
    categorySlug,
    search,
    retryKey,
  ]);

  function handleFiltersChange(changes) {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      filters: {
        ...previous.filters,
        ...changes,
      },
    }));
  }

  function handleFiltersReset() {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      filters: {
        inStock: false,
        minPrice: "",
        maxPrice: "",
      },
    }));
  }

  function handleOrderingChange(nextOrdering) {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      ordering: nextOrdering,
    }));
  }

  function handlePageChange(nextPage) {
    setQuery((previous) => ({
      ...previous,
      page: nextPage,
    }));

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    resultsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleRetry() {
    setRetryKey((previous) => previous + 1);
  }

  const title = search
    ? `نتایج جست‌وجو برای «${search}»`
    : categoryName || (
        categorySlug ? "محصولات دسته‌بندی" : "همهٔ محصولات"
      );

  return (
    <section
      className="products-page"
      dir="rtl"
      aria-labelledby="products-page-title"
    >

      <div className="products-page__layout">
        <div className="products-page__sidebar">
          <ProductFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </div>

        <div
          ref={resultsRef}
          className="products-page__results"
        >
          <ProductSortBar
            ordering={ordering}
            onOrderingChange={handleOrderingChange}
            count={totalCount}
            loading={loading}
          />

          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            onRetry={handleRetry}
            onSelect={onSelect}
          />

          {!error && (
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>
      </div>
    </section>
  );
}
