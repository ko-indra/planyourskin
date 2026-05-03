"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";
import ProductCard from "@/components/product/ProductCard";
import { type ProductSummary } from "@/lib/shopify";

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; products: ProductSummary[] }
  | { status: "error"; message: string };

export default function WishlistPage() {
  const accessToken = useAccount((s) => s.accessToken);
  const isLoggedIn = useAccount((s) => s.isLoggedIn);
  const open = useAccount((s) => s.open);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!isLoggedIn() || !accessToken) {
      setState({ status: "anonymous" });
      return;
    }
    setState({ status: "loading" });
    fetch("/api/wishlist/products", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { products: ProductSummary[] }) => setState({ status: "ready", products: d.products }))
      .catch((e: Error) => setState({ status: "error", message: e.message }));
  }, [accessToken, isLoggedIn]);

  return (
    <div className="mx-auto max-w-site px-4 py-12 md:px-8">
      <h1 className="font-display text-3xl md:text-4xl">Wishlist</h1>

      <div className="mt-8">
        {state.status === "loading" && (
          <p className="py-8 text-center text-neutral-500">Memuat wishlist…</p>
        )}

        {state.status === "anonymous" && (
          <div className="py-16 text-center">
            <p className="text-neutral-600">
              Login dulu untuk menyimpan & melihat wishlist Anda.
            </p>
            <button
              type="button"
              onClick={() => open("login")}
              className="mt-4 rounded-full bg-brand px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Login / Daftar
            </button>
          </div>
        )}

        {state.status === "ready" && state.products.length === 0 && (
          <p className="py-16 text-center text-neutral-600">Wishlist Anda masih kosong.</p>
        )}

        {state.status === "ready" && state.products.length > 0 && (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
            {state.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="py-8 text-center text-red-600">Error: {state.message}</p>
        )}
      </div>
    </div>
  );
}
