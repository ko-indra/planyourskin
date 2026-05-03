"use client";
import { useState } from "react";
import { useAccount } from "@/lib/account-store";
import { useWishlist } from "@/lib/wishlist-store";

export default function WishlistButton({ productId }: { productId: string }) {
  const accessToken = useAccount((s) => s.accessToken);
  const isLoggedIn = useAccount((s) => s.isLoggedIn);
  const openModal = useAccount((s) => s.open);
  const isWishlisted = useWishlist((s) => s.productIds.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!isLoggedIn() || !accessToken) {
      openModal("login");
      return;
    }
    setBusy(true);
    try {
      await toggle(productId, accessToken);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={isWishlisted}
      className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] transition-colors hover:text-brand disabled:opacity-50"
    >
      {isWishlisted ? <HeartFilled /> : <HeartOutline />}
      {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
    </button>
  );
}

function HeartOutline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function HeartFilled() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
