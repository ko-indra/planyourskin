"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";
import { formatMoney, type CustomerOrder, type ProductSummary } from "@/lib/shopify";

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
  const [wishlist, setWishlist] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      .then((d: { products: ProductSummary[] }) => setWishlist(d.products ?? []))
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
              {wishlist.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3">
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
                    className="flex-1 text-[14px] text-[#222529] hover:text-brand"
                  >
                    {p.title}
                  </Link>
                  <p className="text-[13px] text-[#777]">
                    {formatMoney(p.priceRange.minVariantPrice)}
                  </p>
                </li>
              ))}
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
