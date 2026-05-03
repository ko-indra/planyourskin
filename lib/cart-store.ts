"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  image: string | null;
  priceAmount: number;
  currencyCode: string;
  quantity: number;
  weightGrams: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
  totalWeightGrams: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, quantity: l.quantity + qty } : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }] };
        }),
      remove: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      setQty: (variantId, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(0, qty) } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.priceAmount * l.quantity, 0),
      totalWeightGrams: () =>
        get().lines.reduce((sum, l) => sum + l.weightGrams * l.quantity, 0),
    }),
    { name: "pys-cart" }
  )
);
