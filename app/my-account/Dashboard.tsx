"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";
import { useCart, type CartLine } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { formatMoney, type CustomerOrder, type ProductWithFirstVariant } from "@/lib/shopify";

const WEIGHT_TO_GRAMS = {
  GRAMS: 1,
  KILOGRAMS: 1000,
  OUNCES: 28.3495,
  POUNDS: 453.592,
} as const;

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function statusLabel(s: string | null): { text: string; cls: string } {
  if (!s) return { text: "—", cls: "bg-neutral-100 text-neutral-600" };
  const upper = s.toUpperCase();
  if (["PAID", "FULFILLED"].includes(upper)) {
    return { text: upper, cls: "bg-green-50 text-green-700 ring-1 ring-green-200" };
  }
  if (["PENDING", "AUTHORIZED", "PARTIALLY_PAID"].includes(upper)) {
    return { text: upper, cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  }
  if (["UNFULFILLED", "PARTIALLY_FULFILLED"].includes(upper)) {
    return { text: upper.replace("_", " "), cls: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200" };
  }
  if (["REFUNDED", "VOIDED"].includes(upper)) {
    return { text: upper, cls: "bg-red-50 text-red-700 ring-1 ring-red-200" };
  }
  return { text: upper.replace(/_/g, " "), cls: "bg-neutral-100 text-neutral-700" };
}

export default function MyAccountDashboard() {
  const { customer, accessToken, clearAuth, open, isLoggedIn } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [wishlist, setWishlist] = useState<ProductWithFirstVariant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const cartAdd = useCart((s) => s.add);
  const wishlistToggle = useWishlist((s) => s.toggle);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn() || !accessToken) return;
    fetch("/api/customer/orders", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { orders: CustomerOrder[] }) => setOrders(d.orders))
      .catch((e: Error) => setError(e.message));

    fetch("/api/wishlist/products", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { products: ProductWithFirstVariant[] }) => setWishlist(d.products ?? []))
      .catch(() => setWishlist([]));
  }, [mounted, accessToken, isLoggedIn]);

  if (!mounted) return <div className="text-center text-[#777]">Loading…</div>;

  if (!isLoggedIn() || !customer) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-[32px] font-semibold text-[#222529]">My Account</h1>
        <p className="mb-6 text-[15px] text-[#777]">
          Kamu belum login. Login dulu untuk melihat dashboard.
        </p>
        <button
          onClick={() => open("login")}
          className="rounded-full bg-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white hover:opacity-90"
        >
          Login
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    if (accessToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      }).catch(() => {});
    }
    clearAuth();
  };

  const fullName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email;

  const handleAddToCart = (p: ProductWithFirstVariant) => {
    const v = p.firstVariant;
    if (!v) return;
    const grams = Math.round(v.weight * WEIGHT_TO_GRAMS[v.weightUnit]);
    const line: Omit<CartLine, "quantity"> = {
      variantId: v.id,
      productHandle: p.handle,
      title: p.title,
      variantTitle: v.title,
      image: p.featuredImage?.url ?? null,
      priceAmount: parseFloat(v.price.amount),
      currencyCode: v.price.currencyCode,
      weightGrams: grams,
    };
    cartAdd(line, 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleRemoveWishlist = async (productId: string) => {
    if (!accessToken) return;
    setBusyId(productId);
    setWishlist((prev) => prev?.filter((p) => p.id !== productId) ?? null);
    try {
      await wishlistToggle(productId, accessToken);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[32px] font-semibold text-[#222529]">Hi, {fullName}</h1>
      <p className="mt-1 text-[15px] text-[#777]">{customer.email}</p>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold text-[#222529]">Order History</h2>
          {orders && orders.length > 0 && (
            <span className="text-[13px] text-[#777]">
              {orders.length} pesanan
            </span>
          )}
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!error && orders === null && (
          <div className="rounded-lg border border-neutral-200 p-8 text-center text-[#777]">
            Memuat pesanan…
          </div>
        )}

        {!error && orders && orders.length === 0 && (
          <div className="rounded-lg border border-neutral-200 p-12 text-center">
            <p className="text-[15px] text-[#777]">Belum ada pesanan.</p>
            <a
              href="/shop"
              className="mt-4 inline-block rounded bg-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[#3a3e44]"
            >
              Mulai Belanja
            </a>
          </div>
        )}

        {!error && orders && orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold text-[#222529]">Wishlist</h2>
          {wishlist && wishlist.length > 0 && (
            <span className="text-[13px] text-[#777]">{wishlist.length} produk</span>
          )}
        </div>

        {wishlist === null && (
          <div className="rounded-lg border border-neutral-200 p-8 text-center text-[#777]">
            Memuat wishlist…
          </div>
        )}

        {wishlist && wishlist.length === 0 && (
          <div className="rounded-lg border border-neutral-200 p-12 text-center">
            <p className="text-[15px] text-[#777]">Belum ada produk di wishlist.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded bg-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[#3a3e44]"
            >
              Jelajahi Produk
            </Link>
          </div>
        )}

        {wishlist && wishlist.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <ul className="divide-y divide-neutral-100">
              {wishlist.slice(0, 5).map((p) => {
                const v = p.firstVariant;
                const canAdd = !!v && v.availableForSale;
                const isAdded = addedId === p.id;
                const isBusy = busyId === p.id;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5"
                  >
                    <Link
                      href={`/product/${p.handle}`}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100"
                    >
                      {p.featuredImage?.url && (
                        <Image
                          src={p.featuredImage.url}
                          alt={p.featuredImage.altText ?? p.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <Link
                      href={`/product/${p.handle}`}
                      className="min-w-0 flex-1 text-[14px] text-[#222529] hover:text-brand"
                    >
                      <span className="block truncate">{p.title}</span>
                      <span className="block text-[12px] text-[#777]">
                        {formatMoney(p.priceRange.minVariantPrice)}
                      </span>
                    </Link>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        disabled={!canAdd || isAdded}
                        className="inline-flex h-9 items-center gap-1.5 rounded bg-[#222529] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#3a3e44] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {!canAdd ? "Habis" : isAdded ? "✓ Ditambahkan" : "+ Cart"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveWishlist(p.id)}
                        disabled={isBusy}
                        aria-label={`Hapus ${p.title} dari wishlist`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-neutral-300 text-neutral-500 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
              <span className="text-[12px] text-[#777]">
                {wishlist.length > 5 ? `+${wishlist.length - 5} lagi` : ""}
              </span>
              <Link
                href="/wishlist"
                className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:underline"
              >
                View Wishlist →
              </Link>
            </div>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 rounded-full border border-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] hover:bg-[#222529] hover:text-white"
      >
        Logout
      </button>
    </div>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const fin = statusLabel(order.financialStatus);
  const ful = statusLabel(order.fulfillmentStatus);
  const items = order.lineItems.edges.map((e) => e.node);
  const total = parseFloat(order.totalPrice.amount);

  return (
    <li className="overflow-hidden rounded-lg border border-neutral-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
        <div>
          <p className="text-[15px] font-semibold text-[#222529]">{order.name}</p>
          <p className="text-[12px] text-[#777]">{fmtDate(order.processedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${fin.cls}`}>
            {fin.text}
          </span>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${ful.cls}`}>
            {ful.text}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-neutral-100">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
              {it.variant?.image?.url && (
                <Image
                  src={it.variant.image.url}
                  alt={it.variant.image.altText ?? it.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="flex-1 text-[14px] text-[#222529]">{it.title}</p>
            <p className="text-[13px] text-[#777]">× {it.quantity}</p>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3">
        <p className="text-[14px] text-[#222529]">
          Total: <span className="font-semibold">{fmtIDR(total)}</span>
        </p>
        {order.statusUrl && (
          <a
            href={order.statusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:underline"
          >
            View Detail →
          </a>
        )}
      </div>
    </li>
  );
}
