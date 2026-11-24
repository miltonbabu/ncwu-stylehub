"use client";

import type { Banner } from "@/lib/types";
import { cn, imgFallback, cloudinaryImg } from "@/lib/utils";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_SLIDES: Banner[] = [
  {
    id: 0,
    title: "New Season, New Style",
    subtitle: "Discover the Autumn 2026 collection — fresh silhouettes for every occasion.",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=70",
    link_url: "/shop",
    sort_order: 0,
    is_active: true,
  },
  {
    id: 1,
    title: "Up to 40% Off Outerwear",
    subtitle: "Cozy up in coats and jackets at our best seasonal prices.",
    image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1600&q=70",
    link_url: "/shop?category=jackets-coats",
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    title: "Step Into Comfort",
    subtitle: "Sneakers and boots designed for every adventure.",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=70",
    link_url: "/shop?category=shoes",
    sort_order: 2,
    is_active: true,
  },
];

const SLIDE_MS = 5000;

export function HeroCarousel({ banners }: { banners?: Banner[] }) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  );

  // Autoplay — works the same on desktop and phones (interval driven, not hover driven).
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      // Never advance while the tab is in the background.
      if (document.visibilityState === "visible") go(1);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused, go, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start === null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) > 40) {
      go(delta < 0 ? 1 : -1);
    }
  };

  return (
    <section
      className="relative mx-auto h-[420px] max-w-7xl touch-pan-y overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-black/5 sm:h-[480px] sm:rounded-[2rem] lg:h-[540px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchStartX.current = null;
        setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-out",
            i === index ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-105",
          )}
          aria-hidden={i !== index}
        >
          <img
            src={cloudinaryImg(slide.image_url, { width: 1800, height: 720 })}
            alt={slide.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = imgFallback(`banner-${slide.id}`);
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-text/95 via-brand-text/60 to-brand-text/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center gap-4 p-6 sm:gap-5 sm:p-12 lg:p-16">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-black/20 ring-1 ring-white/25 sm:text-xs">
              Limited Time
            </span>
            <h1 className="font-heading text-[28px] font-bold leading-[1.08] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80 sm:text-lg">{slide.subtitle}</p>
            <div className="flex flex-wrap gap-3 pt-1 sm:pt-2">
              <Link
                href={slide.link_url}
                className="group inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/50 sm:h-12 sm:px-7 sm:text-base"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-11 cursor-pointer items-center rounded-full border-2 border-white/60 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/20 sm:h-12 sm:px-7 sm:text-base"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows are pointer-only; on phones the carousel is swipeable. */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-text shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-xl sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-text shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-xl sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-6">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all duration-300",
              i === index ? "w-7 bg-white" : "w-1.5 bg-white/55 hover:bg-white/85",
            )}
          />
        ))}
      </div>
    </section>
  );
}
