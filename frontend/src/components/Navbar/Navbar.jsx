import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import useTheme from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import MiniCart from "../MiniCart/MiniCart";

import "./Navbar.css";

const formatter = new Intl.NumberFormat("fa-IR");

export default function Navbar({
  storeName = "فروشگاه",
  onContact,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const menuButtonRef = useRef(null);
  const cartButtonRef = useRef(null);
  const cartRootRef = useRef(null);
  const cartCloseTimerRef = useRef(null);

  const location = useLocation();

  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const { totalQuantity } = useCart();

  useEffect(() => {
    window.clearTimeout(cartCloseTimerRef.current);
    setIsMenuOpen(false);
    setIsCartOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    return () => {
      window.clearTimeout(cartCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen && !isCartOpen) return;

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      window.clearTimeout(cartCloseTimerRef.current);

      if (isCartOpen) {
        setIsCartOpen(false);
        cartButtonRef.current?.focus();
      } else {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;

    function handleOutsidePointer(event) {
      if (!cartRootRef.current?.contains(event.target)) {
        window.clearTimeout(cartCloseTimerRef.current);
        setIsCartOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointer
      );
    };
  }, [isCartOpen]);

  function cancelCartClose() {
    window.clearTimeout(cartCloseTimerRef.current);
  }

  function openCartPreview(event) {
    if (event.pointerType !== "mouse") return;

    cancelCartClose();
    setIsMenuOpen(false);
    setIsCartOpen(true);
  }

  function scheduleCartClose(event) {
    if (event.pointerType !== "mouse") return;

    cancelCartClose();

    cartCloseTimerRef.current = window.setTimeout(() => {
      // اگر کاربر با کیبورد داخل پنل کار می‌کند، آن را نبند.
      const activeElement = document.activeElement;
      const panel = document.getElementById("navbar-mini-cart");

      if (panel?.contains(activeElement)) return;

      setIsCartOpen(false);
    }, 180);
  }

  function closeCart() {
    cancelCartClose();

    const hasFocus = cartRootRef.current?.contains(
      document.activeElement
    );

    setIsCartOpen(false);

    if (hasFocus) {
      cartButtonRef.current?.focus();
    }
  }

  function closeNavigation() {
    cancelCartClose();
    setIsMenuOpen(false);
    setIsCartOpen(false);
  }

  function handleContact(event) {
    event.preventDefault();
    closeNavigation();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (onContact) {
          onContact();
          return;
        }

        document.getElementById("contact")?.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      });
    });
  }

  function handleLogout() {
    logout();
    closeNavigation();
  }

  function handleCartKeyDown(event) {
    if (event.key !== "ArrowDown") return;

    event.preventDefault();

    cancelCartClose();
    setIsMenuOpen(false);
    setIsCartOpen(true);

    requestAnimationFrame(() => {
      document.getElementById("navbar-mini-cart")?.focus();
    });
  }

  const themeLabel =
    theme === "dark"
      ? "فعال کردن تم روشن"
      : "فعال کردن تم تاریک";

  const displayName =
    user?.first_name || user?.username || "حساب من";

  return (
    <header className="navbar" dir="rtl">
      <div className="navbar__container">
        <Link
          className="navbar__brand"
          to="/"
          onClick={closeNavigation}
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
        </Link>

        <div className="navbar__actions">
          <div
            ref={cartRootRef}
            className="navbar__cart"
            onPointerEnter={openCartPreview}
            onPointerLeave={scheduleCartClose}
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget)
              ) {
                cancelCartClose();
                setIsCartOpen(false);
              }
            }}
          >
            <Link
              ref={cartButtonRef}
              to="/cart"
              className="navbar__cart-trigger"
              aria-label={`مشاهدهٔ سبد خرید، ${formatter.format(
                totalQuantity
              )} کالا`}
              aria-expanded={isCartOpen}
              aria-controls={
                isCartOpen ? "navbar-mini-cart" : undefined
              }
              onClick={closeNavigation}
              onKeyDown={handleCartKeyDown}
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
                <path d="M3 3h2l2.4 12h10.8L21 7H6" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>

              {totalQuantity > 0 && (
                <span
                  className="navbar__cart-count"
                  aria-hidden="true"
                >
                  {totalQuantity > 99
                    ? "+۹۹"
                    : formatter.format(totalQuantity)}
                </span>
              )}
            </Link>

            {isCartOpen && <MiniCart onClose={closeCart} />}
          </div>

          <button
            className="navbar__theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
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
              isMenuOpen ? "بستن منوی اصلی" : "باز کردن منوی اصلی"
            }
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => {
              cancelCartClose();
              setIsCartOpen(false);
              setIsMenuOpen((previous) => !previous);
            }}
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
            <li>
              <NavLink
                className="navbar__link"
                to="/"
                end
                onClick={closeNavigation}
              >
                خانه
              </NavLink>
            </li>

            <li>
              <NavLink
                className="navbar__link"
                to="/products"
                end
                onClick={closeNavigation}
              >
                محصولات
              </NavLink>
            </li>

            <li>
              <a
                className="navbar__link"
                href="#contact"
                onClick={handleContact}
              >
                تماس با ما
              </a>
            </li>

            {loading ? (
              <li>
                <span className="navbar__account-status" role="status">
                  در حال بررسی حساب…
                </span>
              </li>
            ) : user ? (
              <>
                <li>
                  <NavLink
                    className="navbar__link"
                    to="/profile"
                    onClick={closeNavigation}
                  >
                    {displayName}
                  </NavLink>
                </li>

                <li>
                  <button
                    className="navbar__link navbar__logout"
                    type="button"
                    onClick={handleLogout}
                  >
                    خروج
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  className="navbar__login"
                  to="/login"
                  state={{
                    from:
                      location.pathname +
                      location.search +
                      location.hash,
                  }}
                  onClick={closeNavigation}
                >
                  ورود / ثبت‌نام
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
