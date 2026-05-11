"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, type CartLine } from "@/lib/cart-store";
import { formatMoney, type ProductWithFirstVariant } from "@/lib/shopify";

const WEIGHT_TO_GRAMS = {
  GRAMS: 1,
  KILOGRAMS: 1000,
  OUNCES: 28.3495,
  POUNDS: 453.592,
} as const;

type Props = { handle: string; limit?: number };

export default function ConcernProductSlot({ handle, limit = 3 }: Props) {
  const [products, setProducts] = useState<ProductWithFirstVariant[] | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const cartAdd = useCart((s) => s.add);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/skin-analyzer/products?handle=${encodeURIComponent(handle)}&limit=${limit}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { products: ProductWithFirstVariant[] }) => {
        if (!cancelled) setProducts(d.products ?? []);
      })
      .catch((e) => {
        console.warn("Product fetch failed for", handle, e);
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [handle, limit]);

  const handleAdd = (p: ProductWithFirstVariant) => {
    const v = p.firstVariant;
    if (!v) return;
    const grams = Math.round(v.weight * WEIGHT_TO_GRAMS[v.weightUnit]);
    const line: Omit<CartLine, "quantity"> = {
      variantId: v.id,
      productHandle: p.handle,
      title: p.title,
      variantTitle: v.title,
      image: p.featuredImage?.url ?? null,
      priceAmount: parseFloat(v.price.amount),
      currencyCode: v.price.currencyCode,
      weightGrams: grams,
    };
    cartAdd(line, 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (products === null) {
    return (
      <p className="mt-3 text-[12px] text-neutral-400">Memuat rekomendasi produk…</p>
    );
  }
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        Produk yang direkomendasikan
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {products.map((p) => {
          const v = p.firstVariant;
          const canAdd = !!v && v.availableForSale;
          const isAdded = addedId === p.id;
          return (
            <li
              key={p.id}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              <Link href={`/product/${p.handle}`} className="block">
                <div className="relative aspect-square bg-neutral-100">
                  {p.featuredImage?.url && (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>
              <div className="space-y-1 p-2">
                <Link
                  href={`/product/${p.handle}`}
                  className="block text-[12px] font-medium leading-tight text-[#222529] hover:text-brand line-clamp-2"
                >
                  {p.title}
                </Link>
                <p className="text-[12px] text-neutral-600">
                  {formatMoney(p.priceRange.minVariantPrice)}
                </p>
                <button
                  type="button"
                  onClick={() => handleAdd(p)}
                  disabled={!canAdd || isAdded}
                  className="mt-1 inline-flex h-8 w-full items-center justify-center rounded bg-[#222529] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#3a3e44] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {!canAdd ? "Habis" : isAdded ? "✓ Ditambahkan" : "+ Keranjang"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
