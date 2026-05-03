"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type Status = {
  order_id: string;
  transaction_status: string;
  payment_type?: string;
  gross_amount: string;
  transaction_time?: string;
};

export default function CheckoutSuccessPage() {
  const clear = useCart((s) => s.clear);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order_id");
    if (!id) {
      setError("order_id tidak ditemukan");
      return;
    }
    setOrderId(id);
    fetch(`/api/midtrans/status?order_id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setStatus(d);
        // Clear cart when payment is successful
        if (d.transaction_status === "capture" || d.transaction_status === "settlement") {
          clear();
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [clear]);

  const isSuccess =
    status &&
    (status.transaction_status === "capture" || status.transaction_status === "settlement");
  const isPending = status && status.transaction_status === "pending";
  const isFailed =
    status &&
    ["deny", "expire", "cancel", "failure"].includes(status.transaction_status);

  return (
    <div className="mx-auto max-w-site px-4 py-10 md:px-8 md:py-14">
      <StepIndicator />

      <div className="mx-auto max-w-2xl">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm text-brand hover:underline">
              Kembali ke Beranda
            </Link>
          </div>
        )}

        {!error && !status && (
          <p className="py-8 text-center text-neutral-500">Memuat status pembayaran…</p>
        )}

        {isSuccess && status && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl md:text-4xl">Pembayaran Berhasil</h1>
            <p className="mt-3 text-neutral-600">
              Terima kasih, pesanan Anda sudah kami terima.
            </p>
            <div className="mt-8 rounded border border-neutral-200 p-6 text-left">
              <Row label="Order ID" value={status.order_id} />
              <Row label="Pembayaran" value={status.payment_type ?? "-"} />
              <Row label="Total" value={fmtIDR(parseFloat(status.gross_amount))} />
              {status.transaction_time && (
                <Row label="Waktu Transaksi" value={status.transaction_time} />
              )}
              <Row label="Status" value={status.transaction_status} />
            </div>
            <Link
              href="/shop"
              className="mt-8 inline-block rounded bg-[#222529] px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#3a3e44]"
            >
              Lanjut Belanja
            </Link>
          </div>
        )}

        {isPending && status && (
          <div className="text-center">
            <h1 className="font-display text-3xl">Menunggu Pembayaran</h1>
            <p className="mt-3 text-neutral-600">
              Pembayaran Anda sedang menunggu konfirmasi dari penyedia pembayaran.
            </p>
            <div className="mt-6 rounded border border-neutral-200 p-6 text-left">
              <Row label="Order ID" value={status.order_id} />
              <Row label="Status" value={status.transaction_status} />
            </div>
          </div>
        )}

        {isFailed && status && (
          <div className="text-center">
            <h1 className="font-display text-3xl text-red-700">Pembayaran Gagal</h1>
            <p className="mt-3 text-neutral-600">
              Status: <strong>{status.transaction_status}</strong>. Silakan coba lagi atau pilih metode pembayaran lain.
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-block rounded bg-[#222529] px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#3a3e44]"
            >
              Kembali ke Keranjang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-[#222529]">{value}</span>
    </div>
  );
}

function StepIndicator() {
  return (
    <div className="mb-10 flex items-center justify-center gap-3 text-lg md:gap-4 md:text-2xl">
      <Link href="/cart" className="text-neutral-400 hover:text-neutral-600">
        Shopping Cart
      </Link>
      <Chevron />
      <Link href="/checkout" className="text-neutral-400 hover:text-neutral-600">
        Checkout
      </Link>
      <Chevron />
      <span className="font-bold text-[#222529]">Order Complete</span>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
