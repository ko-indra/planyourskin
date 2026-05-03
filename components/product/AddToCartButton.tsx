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

const WHATSAPP_NUMBER = "6285218265003"; // 0852-1826-5003

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

  const waText = encodeURIComponent(
    `Halo Plan Your Skin, saya tertarik dengan ${product.title}.`
  );
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

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

      <div className="flex items-stretch gap-3">
        {/* Qty stepper */}
        <div className="flex h-12 items-center rounded border border-neutral-300">
          <button
            type="button"
            aria-label="Kurangi"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-10 items-center justify-center text-lg text-neutral-700 hover:bg-neutral-100"
          >
            −
          </button>
          <span className="w-10 text-center text-base tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Tambah"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-full w-10 items-center justify-center text-lg text-neutral-700 hover:bg-neutral-100"
          >
            +
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={onAdd}
          disabled={!variant.availableForSale}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded bg-[#222529] px-6 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#3a3e44] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BagIcon />
          {!variant.availableForSale ? "Habis" : added ? "Ditambahkan ✓" : "Add to Cart"}
        </button>

        {/* WhatsApp circular */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tanya via WhatsApp"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon />
        </a>
      </div>
    </div>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.198.297-.768.967-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
