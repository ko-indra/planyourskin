"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Slide = {
  desktop: string;
  mobile: string;
  alt: string;
  badge?: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
};

const SLIDES: Slide[] = [
  {
    desktop: "/assets/hero-1.webp",
    mobile: "/assets/hero-1-mobile.webp",
    alt: "Melt Away The Day. Keep The Walk Of Slay",
    badge: "NEW",
    headline: "Melt Away The Day.\nKeep The Walk Of Slay",
    subtext: "Baru! 1st Cleanser 'Serum-Infused' yang gak bikin kulit ketarik.",
    ctaLabel: "SHOP NEW ARRIVAL",
    ctaHref: "/product-category/new-arrivals",
  },
  {
    desktop: "/assets/hero-2.jpg",
    mobile: "/assets/hero-2-mobile.webp",
    alt: "Cleansing Serum",
    headline: "Cleansing Serum",
    subtext: "Bersih maksimal tanpa bikin kering.",
    ctaLabel: "SHOP NOW",
    ctaHref: "/product-category/cleansing-serum",
  },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const total = SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section className="relative">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 md:aspect-[1600/583]">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <picture>
              <source media="(min-width: 768px)" srcSet={s.desktop} />
              <Image
                src={s.mobile}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </picture>

            <div className="absolute inset-0">
              <div className="mx-auto flex h-full max-w-site items-center px-6 md:px-12">
                <div className="max-w-xl text-white">
                  {s.badge && (
                    <span className="inline-block rounded-full border border-white/80 px-4 py-1 text-xs font-medium uppercase tracking-widest">
                      {s.badge}
                    </span>
                  )}
                  <h2 className="mt-4 whitespace-pre-line text-3xl font-medium leading-tight md:text-5xl lg:text-[64px] lg:leading-[1.05]">
                    {s.headline}
                  </h2>
                  <p className="mt-3 text-sm opacity-90 md:text-base">{s.subtext}</p>
                  <Link
                    href={s.ctaHref}
                    className="mt-6 inline-block rounded-full bg-[#222529] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                  >
                    {s.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setIdx((i) => (i - 1 + total) % total)}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/80 hover:text-white md:left-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setIdx((i) => (i + 1) % total)}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-white/80 hover:text-white md:right-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === idx ? "w-6 bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
