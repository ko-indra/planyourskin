"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type AccountState = {
  // Modal
  isOpen: boolean;
  view: "login" | "register";
  open: (view?: "login" | "register") => void;
  close: () => void;
  setView: (view: "login" | "register") => void;

  // Auth
  accessToken: string | null;
  expiresAt: string | null;
  customer: Customer | null;
  setAuth: (data: { accessToken: string; expiresAt: string; customer: Customer }) => void;
  clearAuth: () => void;
  isLoggedIn: () => boolean;
};

export const useAccount = create<AccountState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      view: "login",
      open: (view = "login") => set({ isOpen: true, view }),
      close: () => set({ isOpen: false }),
      setView: (view) => set({ view }),

      accessToken: null,
      expiresAt: null,
      customer: null,
      setAuth: ({ accessToken, expiresAt, customer }) =>
        set({ accessToken, expiresAt, customer, isOpen: false }),
      clearAuth: () => set({ accessToken: null, expiresAt: null, customer: null }),
      isLoggedIn: () => {
        const t = get().accessToken;
        const exp = get().expiresAt;
        if (!t || !exp) return false;
        return new Date(exp).getTime() > Date.now();
      },
    }),
    {
      name: "pys-account",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, expiresAt: s.expiresAt, customer: s.customer }),
    }
  )
);
