"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";

const SERVICE_FEE = 2500;

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function StepIndicator({ active }: { active: "cart" | "checkout" | "complete" }) {
  const cls = (key: string) =>
    active === key ? "font-bold text-[#222529]" : "text-neutral-400";
  return (
    <div className="mb-10 flex items-center justify-center gap-3 text-lg md:gap-4 md:text-2xl">
      <span className={cls("cart")}>Shopping Cart</span>
      <Chevron />
      <span className={cls("checkout")}>Checkout</span>
      <Chevron />
      <span className={cls("complete")}>Order Complete</span>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-300"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="mx-auto max-w-site px-4 py-12 md:px-8">Loading…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-site px-4 py-16 md:px-8">
        <StepIndicator active="cart" />
        <div className="text-center">
          <p className="text-neutral-600">Keranjangmu kosong.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded bg-[#222529] px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#3a3e44]"
          >
            Mulai Belanja
          </Link>
        </div>
      </div>
    );
  }

  const sub = subtotal();
  const total = sub + SERVICE_FEE;

  const onApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMsg(coupon.trim() ? "Kupon tidak ditemukan" : "Masukkan kode kupon");
    setTimeout(() => setCouponMsg(null), 3000);
  };

  const onUpdateCart = () => {
    setUpdateMsg("Cart updated ✓");
    setTimeout(() => setUpdateMsg(null), 1500);
  };

  return (
    <div className="mx-auto max-w-site px-4 py-10 md:px-8 md:py-14">
      <StepIndicator active="cart" />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items + actions */}
        <div>
          {/* Table header */}
          <div className="hidden grid-cols-[2.2fr_1fr_1.1fr_1fr] gap-4 border-b border-neutral-300 pb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#222529] md:grid">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
          </div>

          {/* Lines */}
          {lines.map((l) => (
            <div
              key={l.variantId}
              className="grid grid-cols-1 gap-3 border-b border-neutral-200 py-6 md:grid-cols-[2.2fr_1fr_1.1fr_1fr] md:items-center md:gap-4"
            >
              {/* Product */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {l.image && (
                    <Image
                      src={l.image}
                      alt={l.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => remove(l.variantId)}
                    aria-label={`Hapus ${l.title}`}
                    className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-500 transition-colors hover:border-red-400 hover:text-red-600"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <Link
                  href={`/product/${l.productHandle}`}
                  className="text-sm text-[#222529] hover:text-brand"
                >
                  {l.title}
                </Link>
              </div>

              {/* Price */}
              <div className="text-sm text-neutral-500 md:text-[#222529]">
                <span className="font-semibold uppercase tracking-wider md:hidden">
                  Price:{" "}
                </span>
                {fmtIDR(l.priceAmount)}
              </div>

              {/* Qty stepper */}
              <div>
                <div className="inline-flex h-10 items-center rounded border border-neutral-300">
                  <button
                    type="button"
                    onClick={() => setQty(l.variantId, l.quantity - 1)}
                    aria-label="Kurangi"
                    className="flex h-full w-9 items-center justify-center text-base text-neutral-700 hover:bg-neutral-100"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-sm font-semibold tabular-nums">
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(l.variantId, l.quantity + 1)}
                    aria-label="Tambah"
                    className="flex h-full w-9 items-center justify-center text-base text-neutral-700 hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-sm font-semibold text-[#222529]">
                <span className="font-semibold uppercase tracking-wider md:hidden">
                  Subtotal:{" "}
                </span>
                {fmtIDR(l.priceAmount * l.quantity)}
              </div>
            </div>
          ))}

          {/* Coupon + Update cart */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={onApplyCoupon} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="h-11 w-44 rounded border border-neutral-300 px-3 text-sm placeholder:text-neutral-400 focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded border border-neutral-300 bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#222529] transition-colors hover:bg-neutral-50"
              >
                Apply Coupon
              </button>
              {couponMsg && (
                <span className="text-xs text-neutral-500">{couponMsg}</span>
              )}
            </form>

            <div className="flex items-center gap-3">
              {updateMsg && <span className="text-xs text-green-600">{updateMsg}</span>}
              <button
                type="button"
                onClick={onUpdateCart}
                className="h-11 rounded border border-neutral-300 bg-neutral-100 px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500 transition-colors hover:bg-neutral-200"
              >
                Update Cart
              </button>
            </div>
          </div>
        </div>

        {/* Cart Totals card */}
        <aside className="h-fit border border-neutral-200 p-6">
          <h2 className="border-b border-neutral-200 pb-4 text-[14px] font-semibold uppercase tracking-[0.08em] text-[#222529]">
            Cart Totals
          </h2>
          <div className="py-2 text-[14px] text-[#222529]">
            <div className="flex items-center justify-between border-b border-neutral-200 py-4">
              <span>Subtotal</span>
              <span>{fmtIDR(sub)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-200 py-4">
              <span className="text-neutral-500">Biaya Layanan</span>
              <span className="text-neutral-500">{fmtIDR(SERVICE_FEE)}</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span>Total</span>
              <span className="text-lg font-bold">{fmtIDR(total)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-[#222529] px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#3a3e44]"
          >
            Proceed to Checkout
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </aside>
      </div>
    </div>
  );
}
