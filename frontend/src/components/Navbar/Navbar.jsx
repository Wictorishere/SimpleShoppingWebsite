import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import useTheme from "../../hooks/useTheme";

const navigationLinks = [
  { href: "#home", label: "خانه" },
  { href: "#products", label: "محصولات" },
  { href: "#contact", label: "تماس با ما" },
];

export default function Navbar({ storeName = "فروشگاه" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { theme, toggleTheme } = useTheme();


  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

return (
  <header className="navbar" dir="rtl">
    <div className="navbar__container">
      <a
        className="navbar__brand"
        href="#home"
        onClick={closeMenu}
      >
        <span className="navbar__brand-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 7h12l2 13H4L6 7Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </span>

        <span className="navbar__brand-name">
          {storeName}
        </span>
      </a>

      <div className="navbar__actions">
        <button
          className="navbar__theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "فعال کردن تم روشن"
              : "فعال کردن تم تاریک"
          }
          title={
            theme === "dark"
              ? "فعال کردن تم روشن"
              : "فعال کردن تم تاریک"
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {theme === "dark" ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
              </>
            ) : (
              <path d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z" />
            )}
          </svg>
        </button>

        <button
          ref={menuButtonRef}
          className="navbar__toggle"
          type="button"
          aria-label={
            isMenuOpen
              ? "بستن منوی اصلی"
              : "باز کردن منوی اصلی"
          }
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMenuOpen((previous) => !previous)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <nav
        id="main-navigation"
        aria-label="منوی اصلی"
        className={`navbar__navigation ${
          isMenuOpen ? "navbar__navigation--open" : ""
        }`}
      >
        <ul className="navbar__links">
          {navigationLinks.map((link) => (
            <li key={link.href}>
              <a
                className="navbar__link"
                href={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);

}
