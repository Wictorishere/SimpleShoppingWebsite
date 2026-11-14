import { useState } from "react";

export default function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light",
  );

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      localStorage.setItem("store-theme", nextTheme);
    } catch {
      // تغییر تم حتی بدون دسترسی به localStorage کار می‌کند.
    }

    setTheme(nextTheme);
  }

  return { theme, toggleTheme };
}
