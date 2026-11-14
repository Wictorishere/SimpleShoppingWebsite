import { useEffect, useState } from "react";
import "./HeroSlider.css";

export default function HeroSlider({ slides = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false);

  const slideCount = slides.length;

  const currentIndex =
    slideCount > 0 ? activeIndex % slideCount : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function handleMotionChange() {
      setPrefersReducedMotion(mediaQuery.matches);
    }

    function handleVisibilityChange() {
      setIsPageHidden(document.hidden);
    }

    handleMotionChange();
    handleVisibilityChange();

    mediaQuery.addEventListener("change", handleMotionChange);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  const canAutoPlay =
    slideCount > 1 &&
    !isPaused &&
    !isHovered &&
    !isFocused &&
    !isPageHidden &&
    !prefersReducedMotion;

  useEffect(() => {
    if (!canAutoPlay) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((previous) => (previous + 1) % slideCount);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, canAutoPlay, slideCount]);

  function goToPrevious() {
    if (slideCount < 2) return;

    setActiveIndex(
      (previous) =>
        (previous % slideCount - 1 + slideCount) % slideCount
    );
  }

  function goToNext() {
    if (slideCount < 2) return;

    setActiveIndex((previous) => (previous + 1) % slideCount);
  }

  function handleKeyDown(event) {
    if (slideCount < 2) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToNext();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToPrevious();
    }
  }

  if (slideCount === 0) {
    return null;
  }

  return (
    <section
      className="hero-slider"
      dir="rtl"
      role="region"
      aria-roledescription="اسلایدر"
      aria-label="ویترین فروشگاه"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="hero-slider__slides">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <article
              key={slide.id}
              className={`hero-slider__slide ${
                isActive ? "hero-slider__slide--active" : ""
              }`}
              role="group"
              aria-roledescription="اسلاید"
              aria-label={`${index + 1} از ${slideCount}`}
              aria-hidden={!isActive}
            >
              <img
                className="hero-slider__image"
                src={slide.image}
                alt={slide.alt || slide.title}
                style={{
                  objectPosition: slide.position || "center",
                }}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
              />

              <div
                className="hero-slider__overlay"
                aria-hidden="true"
              />

              <div className="hero-slider__content">
                {slide.eyebrow && (
                  <span className="hero-slider__eyebrow">
                    <span aria-hidden="true" />
                    {slide.eyebrow}
                  </span>
                )}

                <h2 className="hero-slider__title">
                  {slide.title}
                </h2>

                {slide.description && (
                  <p className="hero-slider__description">
                    {slide.description}
                  </p>
                )}

                {slide.buttonText && slide.href && (
                  <a
                    className="hero-slider__cta"
                    href={slide.href}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {slide.buttonText}
                    <span aria-hidden="true">←</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {slideCount > 1 && (
        <div className="hero-slider__bottom">
          <div
            className="hero-slider__pagination"
            role="group"
            aria-label="انتخاب اسلاید"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                className={`hero-slider__dot ${
                  index === currentIndex
                    ? "hero-slider__dot--active"
                    : ""
                }`}
                type="button"
                aria-label={`نمایش اسلاید ${index + 1}: ${slide.title}`}
                aria-current={
                  index === currentIndex ? "true" : undefined
                }
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <div className="hero-slider__controls">
            <span
              className="hero-slider__counter"
              aria-hidden="true"
            >
              {String(currentIndex + 1).padStart(2, "0")}
              <span>
                {" / "}
                {String(slideCount).padStart(2, "0")}
              </span>
            </span>

            <button
              className="hero-slider__control hero-slider__arrow"
              type="button"
              onClick={goToNext}
              aria-label="اسلاید قبلی"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <button
              className="hero-slider__control hero-slider__arrow"
              type="button"
              onClick={goToPrevious}
              aria-label="اسلاید بعدی"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5m6-6-6 6 6 6" />
              </svg>
            </button>

            {!prefersReducedMotion && (
              <button
                className="hero-slider__control hero-slider__play"
                type="button"
                onClick={() =>
                  setIsPaused((previous) => !previous)
                }
                aria-label={
                  isPaused
                    ? "پخش خودکار اسلایدر"
                    : "توقف پخش خودکار"
                }
              >
                <span aria-hidden="true">
                  {isPaused ? "▶" : "Ⅱ"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
