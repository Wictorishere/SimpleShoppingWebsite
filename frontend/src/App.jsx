import { useEffect, useState } from "react";
import { apiGet } from "./api/client";

import "./App.css";

import Navbar from "./components/Navbar/Navbar";
import StoreHero from "./components/HeroSlider/StoreHero";
import DailyDeals from "./components/DailyDeals/DailyDeals";
import CategoryGrid from "./components/CategoryGrid/CategoryGrid";
import StoreBenefits from "./components/StoreBenefits/StoreBenefits";
import ProductSection from "./components/ProductSection/ProductSection";
import Footer from "./components/footer/Footer";



export default function App() {
  const [store, setStore] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      try {
        const data = await apiGet("/core/store/");

        if (!cancelled) {
          setStore(data);
        }
      } catch (error) {
        console.error("دریافت اطلاعات فروشگاه ناموفق بود:", error);
      }
    }

    loadStore();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app" dir="rtl">
      <Navbar storeName={store?.name ?? "فروشگاه"} />

      <main className="container main-content">
        <StoreHero />

        <StoreBenefits />

        <DailyDeals />

        <CategoryGrid />

        <ProductSection title="جدیدترین محصولات" />
      </main>

      <Footer store={store} />
    </div>
  );
}
