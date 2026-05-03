"use client";
import { useState } from "react";
import { useCart, type CartLine } from "@/lib/cart-store";
import type { ProductDetail } from "@/lib/shopify";

const WEIGHT_TO_GRAMS = {
  GRAMS: 1,
  KILOGRAMS: 1000,
  OUNCES: 28.3495,
  POUNDS: 453.592,
} as const;

export default function AddToCartButton({ product }: { product: ProductDetail }) {
  const variants = product.variants.edges.map((e) => e.node);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!variant) return null;

  const onAdd = () => {
    const grams = Math.round(variant.weight * WEIGHT_TO_GRAMS[variant.weightUnit]);
    const line: Omit<CartLine, "quantity"> = {
      variantId: variant.id,
      productHandle: product.handle,
      title: product.title,
      variantTitle: variant.title,
      image: product.featuredImage?.url ?? null,
      priceAmount: parseFloat(variant.price.amount),
      currencyCode: variant.price.currencyCode,
      weightGrams: grams,
    };
    add(line, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <label className="mb-1 block text-sm font-medium">Varian</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                {v.title}
                {!v.availableForSale ? " (Habis)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 rounded border border-neutral-300 px-3 py-2"
        />
      </div>
      <button
        onClick={onAdd}
        disabled={!variant.availableForSale}
        className="w-full rounded-full bg-brand px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!variant.availableForSale
          ? "Habis"
          : added
            ? "✓ Ditambahkan ke keranjang"
            : "Tambah ke Keranjang"}
      </button>
    </div>
  );
}
