"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";

export default function CartIcon() {
  const total = useCart((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative inline-flex items-center hover:text-brand"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L22 7H6" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="ml-1 text-[11px] font-medium tabular-nums">
        {mounted ? total : 0}
      </span>
    </Link>
  );
}
