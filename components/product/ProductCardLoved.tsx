"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatMoney, type ProductSummary } from "@/lib/shopify";
import { useCart } from "@/lib/cart-store";

export default function ProductCardLoved({ product }: { product: ProductSummary }) {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const isOnSale =
    compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);
  const discountPct = isOnSale
    ? Math.round(
        (1 - parseFloat(price.amount) / parseFloat(compareAt!.amount)) * 100
      )
    : 0;
  const categories = product.collections?.edges?.map((e) => e.node.title) ?? [];
  const images = product.previewImages?.edges?.map((e) => e.node) ?? [];
  const primary = product.featuredImage ?? images[0] ?? null;
  const hover = images[1] ?? null;

  const [wishlisted, setWishlisted] = useState(false);
  const add = useCart((s) => s.add);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primary) return;
    add({
      variantId: product.id,
      productHandle: product.handle,
      title: product.title,
      variantTitle: "",
      image: primary.url,
      priceAmount: parseFloat(price.amount),
      currencyCode: price.currencyCode,
      weightGrams: 100,
    });
  };

  return (
    <Link href={`/product/${product.handle}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-contain transition-opacity duration-500 ${
              hover ? "group-hover:opacity-0" : ""
            }`}
          />
        )}
        {hover && (
          <Image
            src={hover.url}
            alt={hover.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {isOnSale && (
          <span className="absolute left-3 top-3 inline-block rounded-[10px] bg-[#e27c7c] px-[11px] py-[5px] text-[10px] font-semibold text-white">
            -{discountPct}%
          </span>
        )}

        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishlisted((v) => !v);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#222529] shadow-sm transition-colors hover:text-brand"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleAdd}
          className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-[#222529] py-3.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-transform duration-300 group-hover:translate-y-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          ADD TO CART
        </button>
      </div>

      <div className="mt-4 space-y-1.5 text-center">
        {categories.length > 0 && (
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
            {categories.slice(0, 2).join(", ")}
          </p>
        )}
        <h3 className="text-[15px] font-medium text-[#222529] line-clamp-2">{product.title}</h3>
        <Stars />
        <p className="flex items-center justify-center gap-2 text-[14px]">
          {isOnSale && (
            <span className="text-[#a7a7a7] line-through">{formatMoney(compareAt!)}</span>
          )}
          <span className="font-semibold text-[#444]">{formatMoney(price)}</span>
        </p>
      </div>
    </Link>
  );
}

function Stars() {
  return (
    <div className="flex items-center justify-center gap-0.5 text-[#ddd]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.97 6.02L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.03-1.25z" />
        </svg>
      ))}
    </div>
  );
}
