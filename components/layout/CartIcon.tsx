"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartLine } from "@/lib/cart-store";
import { useEffect, useRef, useState } from "react";

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartIcon() {
  const lines = useCart((s) => s.lines);
  const total = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotal());
  const remove = useCart((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const showOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const hasItems = mounted && lines.length > 0;

  return (
    <div className="relative" onMouseEnter={showOpen} onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-label="Cart"
        aria-expanded={open}
        onClick={(e) => e.preventDefault()}
        className="relative inline-flex cursor-default items-center hover:text-brand"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L22 7H6" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
        </svg>
        <span className="ml-1 text-[11px] font-medium tabular-nums">
          {mounted ? total : 0}
        </span>
      </button>

      {/* Hover dropdown — desktop only */}
      {open && hasItems && (
        <div className="absolute right-0 top-full z-50 mt-3 hidden w-[360px] rounded-sm bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)] nav:block">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#222529]">
              <span>
                {total} item{total !== 1 ? "s" : ""}
              </span>
              <Link
                href="/cart"
                className="text-[#222529] hover:text-brand"
              >
                View Cart
              </Link>
            </div>

            {/* Lines */}
            <div className="max-h-[280px] space-y-4 overflow-y-auto py-4">
              {lines.map((line) => (
                <MiniCartLine
                  key={line.variantId}
                  line={line}
                  onRemove={() => remove(line.variantId)}
                />
              ))}
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between border-t border-neutral-200 py-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#222529]">
              <span>Subtotal:</span>
              <span className="text-[15px]">{fmtIDR(subtotal)}</span>
            </div>

            {/* Checkout */}
            <Link
              href="/checkout"
              className="block rounded-sm bg-[#222529] py-3 text-center text-[13px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#3a3e44]"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCartLine({
  line,
  onRemove,
}: {
  line: CartLine;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-[#222529]">{line.title}</p>
        <p className="mt-1 text-[13px] text-neutral-500">
          {line.quantity} × <span className="text-brand">{fmtIDR(line.priceAmount)}</span>
        </p>
      </div>
      <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded bg-neutral-100">
        {line.image ? (
          <Image
            src={line.image}
            alt={line.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus ${line.title}`}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#222529] shadow hover:bg-neutral-100"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
