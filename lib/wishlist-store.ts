"use client";
import { create } from "zustand";

type WishlistState = {
  productIds: string[];
  hydrated: boolean;
  hydrate: (accessToken: string) => Promise<void>;
  toggle: (productId: string, accessToken: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()((set, get) => ({
  productIds: [],
  hydrated: false,
  hydrate: async (accessToken) => {
    if (get().hydrated) return;
    try {
      const res = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { productIds: string[] };
        set({ productIds: data.productIds, hydrated: true });
      }
    } catch {
      // network error — leave state untouched, will retry on next hydrate call
    }
  },
  toggle: async (productId, accessToken) => {
    const before = get().productIds;
    const isIn = before.includes(productId);
    const optimistic = isIn ? before.filter((id) => id !== productId) : [...before, productId];
    set({ productIds: optimistic });
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action: "toggle", productId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { productIds: string[] };
        set({ productIds: data.productIds });
      } else {
        set({ productIds: before });
      }
    } catch {
      set({ productIds: before });
    }
  },
  isWishlisted: (productId) => get().productIds.includes(productId),
  clear: () => set({ productIds: [], hydrated: false }),
}));
