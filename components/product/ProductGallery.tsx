"use client";
import Image from "next/image";
import { useState } from "react";

type Img = { url: string; altText: string | null; width: number; height: number };

export default function ProductGallery({
  images,
  title,
  salePercent,
}: {
  images: Img[];
  title: string;
  salePercent: number | null;
}) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;

  const current = images[idx];
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div className="flex gap-3 md:gap-4">
      {/* Vertical thumbnails */}
      {images.length > 1 && (
        <div className="flex w-16 flex-col gap-2 md:w-20">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Thumbnail ${i + 1}`}
              aria-current={i === idx}
              className={`relative aspect-square overflow-hidden rounded border-2 transition-colors ${
                i === idx ? "border-brand" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-square overflow-hidden rounded bg-neutral-50">
        {salePercent !== null && (
          <div className="absolute left-3 top-3 z-10 rounded-sm bg-[#E58F94] px-3 py-1.5 text-sm font-medium text-white">
            -{salePercent}%
          </div>
        )}
        <Image
          src={current.url}
          alt={current.altText ?? title}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-contain"
          priority={idx === 0}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#222529] shadow transition-all hover:bg-white"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#222529] shadow transition-all hover:bg-white"
            >
              <Chevron dir="right" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}
