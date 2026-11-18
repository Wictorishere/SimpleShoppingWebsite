import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { api } from "./api/client";

import "./App.css";

import Navbar from "./components/Navbar/Navbar";
import StoreHero from "./components/HeroSlider/StoreHero";
import DailyDeals from "./components/DailyDeals/DailyDeals";
import CategoryGrid from "./components/CategoryGrid/CategoryGrid";
import StoreBenefits from "./components/StoreBenefits/StoreBenefits";
import ProductSection from "./components/ProductSection/ProductSection";
import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

import ProductsRoute from "./pages/ProductsPage/ProductsRoute";
import AuthPage from "./pages/AuthPage/AuthPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage";
import CartPage from "./pages/CartPage/CartPage";




export default function App() {
  const [store, setStore] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStore() {
      try {
        const data = await api("/api/core/store/", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setStore(data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(
          "دریافت اطلاعات فروشگاه ناموفق بود:",
          error
        );
      }
    }

    loadStore();
    
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="app" dir="rtl">
      <ScrollToTop />

      <Navbar storeName={store?.name ?? "فروشگاه"} />

      <main className="container main-content">
        <Routes>
          {/* صفحهٔ اصلی */}
          <Route
            path="/"
            element={
              <>
                <StoreHero />

                <StoreBenefits />

                <DailyDeals />

                <CategoryGrid />

                <ProductSection title="جدیدترین محصولات" />
              </>
            }
          />

          {/* ورود و ثبت‌نام */}
          <Route
            path="/login"
            element={<AuthPage />}
          />

          <Route path="/profile" element={<ProfilePage />} />


          {/* تمام محصولات */}
          <Route
            path="/products"
            element={<ProductsRoute />}
          />

          {/* محصولات یک دسته‌بندی */}
          <Route
            path="/categories/:categorySlug"
            element={<ProductsRoute />}
          />

          {/* صفحهٔ موقت جزئیات محصول */}
          <Route
            path="/products/:slug"
            element={<ProductDetailPage />}
          />

          <Route path="/cart" element={<CartPage />} />



          {/* مسیر نامعتبر */}
          <Route
            path="*"
            element={
              <section dir="rtl">
                <h1>صفحه پیدا نشد</h1>

                <p>
                  آدرس واردشده معتبر نیست یا این صفحه
                  دیگر وجود ندارد.
                </p>

                <Link to="/">
                  بازگشت به صفحهٔ اصلی
                </Link>
              </section>
            }
          />
        </Routes>
      </main>

      <Footer store={store} />
    </div>
  );
}
