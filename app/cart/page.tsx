"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="mx-auto max-w-site px-4 py-12 md:px-8">Loading…</div>;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-site px-4 py-20 text-center md:px-8">
        <h1 className="font-display text-3xl">Keranjangmu kosong</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand px-8 py-3 text-sm text-white hover:opacity-90"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: lines[0]?.currencyCode ?? "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="mx-auto max-w-site px-4 py-12 md:px-8">
      <h1 className="mb-8 font-display text-3xl md:text-4xl">Keranjang</h1>
      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-neutral-200">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-4 py-4">
              {l.image && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-neutral-100">
                  <Image src={l.image} alt={l.title} fill sizes="96px" className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <Link
                  href={`/product/${l.productHandle}`}
                  className="font-medium hover:text-brand-accent"
                >
                  {l.title}
                </Link>
                {l.variantTitle && l.variantTitle !== "Default Title" && (
                  <p className="text-sm text-neutral-500">{l.variantTitle}</p>
                )}
                <p className="mt-1 text-sm">{formatIDR(l.priceAmount)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => setQty(l.variantId, parseInt(e.target.value) || 0)}
                    className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => remove(l.variantId)}
                    className="text-sm text-neutral-500 hover:text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="text-sm font-medium">{formatIDR(l.priceAmount * l.quantity)}</div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border border-neutral-200 bg-brand-soft/40 p-6">
          <h2 className="mb-4 font-medium">Ringkasan</h2>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatIDR(subtotal())}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Ongkir dihitung saat checkout.</p>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-brand px-8 py-3 text-center text-sm text-white hover:opacity-90"
          >
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
