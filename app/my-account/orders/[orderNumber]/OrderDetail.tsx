"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";
import { type CustomerOrderDetail, type Money } from "@/lib/shopify";
import { fmtDate, fmtIDR, statusLabel } from "../../_lib/status";

const moneyToIDR = (m: Money | null | undefined) =>
  m ? fmtIDR(parseFloat(m.amount)) : "—";

export default function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const { accessToken, isLoggedIn, open } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn() || !accessToken) return;
    setStatus("loading");
    fetch(`/api/customer/orders/${encodeURIComponent(orderNumber)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (r.status === 404) {
          setStatus("notfound");
          return null;
        }
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d: { order: CustomerOrderDetail } | null) => {
        if (!d) return;
        setOrder(d.order);
        setStatus("ok");
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, [mounted, accessToken, isLoggedIn, orderNumber]);

  if (!mounted) return <div className="text-center text-[#777]">Loading…</div>;

  if (!isLoggedIn()) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-[32px] font-semibold text-[#222529]">My Account</h1>
        <p className="mb-6 text-[15px] text-[#777]">
          Kamu belum login. Login dulu untuk melihat detail pesanan.
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

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-neutral-200 p-8 text-center text-[#777]">
          Memuat detail pesanan…
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-[15px] text-[#777]">
            Pesanan #{orderNumber} tidak ditemukan.
          </p>
          <Link
            href="/my-account"
            className="mt-4 inline-block rounded bg-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[#3a3e44]"
          >
            ← Kembali ke My Account
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Terjadi kesalahan."}
        </div>
        <Link
          href="/my-account"
          className="mt-6 inline-block text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:underline"
        >
          ← Kembali ke My Account
        </Link>
      </div>
    );
  }

  const fin = statusLabel(order.financialStatus);
  const ful = statusLabel(order.fulfillmentStatus);
  const items = order.lineItems.edges.map((e) => e.node);
  const addr = order.shippingAddress;
  const fulfillments = order.successfulFulfillments ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/my-account"
        className="mb-6 inline-block text-[12px] font-semibold uppercase tracking-[0.1em] text-[#777] hover:text-brand"
      >
        ← Kembali ke My Account
      </Link>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-4">
          <div>
            <h1 className="text-[20px] font-semibold text-[#222529]">{order.name}</h1>
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
          {items.map((it, i) => {
            const productHandle = it.variant?.product?.handle;
            const img = it.variant?.image;
            const variantTitle =
              it.variant?.title && it.variant.title !== "Default Title"
                ? it.variant.title
                : null;
            const inner = (
              <>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {img?.url && (
                    <Image
                      src={img.url}
                      alt={img.altText ?? it.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-[#222529]">{it.title}</p>
                  {variantTitle && (
                    <p className="text-[12px] text-[#777]">{variantTitle}</p>
                  )}
                  {it.variant?.sku && (
                    <p className="text-[11px] text-[#999]">SKU: {it.variant.sku}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-[#777]">× {it.quantity}</p>
                  <p className="text-[14px] font-medium text-[#222529]">
                    {moneyToIDR(it.discountedTotalPrice)}
                  </p>
                </div>
              </>
            );
            return (
              <li key={i} className="px-5 py-4">
                {productHandle ? (
                  <Link
                    href={`/product/${productHandle}`}
                    className="flex items-center gap-4 hover:opacity-80"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-neutral-200 px-5 py-4 text-[14px]">
          <div className="flex justify-between text-[#555]">
            <span>Subtotal</span>
            <span>{moneyToIDR(order.currentSubtotalPrice)}</span>
          </div>
          <div className="flex justify-between text-[#555]">
            <span>Pengiriman</span>
            <span>{moneyToIDR(order.currentTotalShippingPrice)}</span>
          </div>
          {order.currentTotalTax && parseFloat(order.currentTotalTax.amount) > 0 && (
            <div className="flex justify-between text-[#555]">
              <span>Pajak</span>
              <span>{moneyToIDR(order.currentTotalTax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-[15px] font-semibold text-[#222529]">
            <span>Total</span>
            <span>{moneyToIDR(order.currentTotalPrice ?? order.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {addr && (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3">
            <h2 className="text-[14px] font-semibold text-[#222529]">Alamat Pengiriman</h2>
          </div>
          <div className="space-y-0.5 px-5 py-4 text-[14px] text-[#555]">
            <p className="font-medium text-[#222529]">
              {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || "—"}
            </p>
            {addr.company && <p>{addr.company}</p>}
            {addr.address1 && <p>{addr.address1}</p>}
            {addr.address2 && <p>{addr.address2}</p>}
            <p>
              {[addr.city, addr.province, addr.zip].filter(Boolean).join(", ")}
            </p>
            {addr.country && <p>{addr.country}</p>}
            {addr.phone && <p className="pt-1 text-[#777]">{addr.phone}</p>}
          </div>
        </div>
      )}

      {/* Tracking */}
      {fulfillments.length > 0 &&
        fulfillments.some((f) => f.trackingInfo.length > 0) && (
          <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
            <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              <h2 className="text-[14px] font-semibold text-[#222529]">Tracking</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {fulfillments.flatMap((f, fi) =>
                f.trackingInfo.map((t, ti) => (
                  <li
                    key={`${fi}-${ti}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[14px]"
                  >
                    <div>
                      <p className="font-medium text-[#222529]">
                        {f.trackingCompany ?? "Kurir"}
                      </p>
                      {t.number && (
                        <p className="text-[12px] text-[#777]">No. resi: {t.number}</p>
                      )}
                    </div>
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:underline"
                      >
                        Lacak Paket →
                      </a>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
    </div>
  );
}
