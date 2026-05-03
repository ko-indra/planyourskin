"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart-store";
import { useAccount } from "@/lib/account-store";
import type { Province, City, District, CostItem } from "@/lib/rajaongkir";

const SERVICE_FEE = 2500;
const COURIER = "jne:tiki:pos:sicepat:jnt:anteraja";

const Schema = z.object({
  email: z.string().email("Email tidak valid"),
  fullName: z.string().min(2, "Nama wajib diisi"),
  phone: z.string().min(8, "No HP tidak valid"),
  provinceId: z.string().min(1, "Pilih provinsi"),
  cityId: z.string().min(1, "Pilih kota"),
  districtId: z.string().min(1, "Pilih kecamatan"),
  postalCode: z.string().min(3, "Kode pos wajib"),
  address: z.string().min(5, "Alamat wajib diisi"),
});
type FormValues = z.infer<typeof Schema>;

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function StepIndicator() {
  return (
    <div className="mb-10 flex items-center justify-center gap-3 text-lg md:gap-4 md:text-2xl">
      <Link href="/cart" className="text-neutral-400 hover:text-neutral-600">Shopping Cart</Link>
      <Chevron />
      <span className="font-bold text-[#222529]">Checkout</span>
      <Chevron />
      <span className="text-neutral-400">Order Complete</span>
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

export default function CheckoutPage() {
  const { lines, setQty, remove, subtotal, totalWeightGrams } = useCart();
  const accountCustomer = useAccount((s) => s.customer);
  const accountIsLoggedIn = useAccount((s) => s.isLoggedIn);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [costLoading, setCostLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<CostItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const provinceId = watch("provinceId");
  const cityId = watch("cityId");
  const districtId = watch("districtId");

  useEffect(() => {
    fetch("/api/rajaongkir/provinces")
      .then((r) => r.json())
      .then((d) => setProvinces(d.data ?? []));
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    setCities([]);
    setDistricts([]);
    setValue("cityId", "");
    setValue("districtId", "");
    fetch(`/api/rajaongkir/cities?province=${provinceId}`)
      .then((r) => r.json())
      .then((d) => setCities(d.data ?? []));
  }, [provinceId, setValue]);

  useEffect(() => {
    if (!cityId) return;
    setDistricts([]);
    setValue("districtId", "");
    fetch(`/api/rajaongkir/districts?city=${cityId}`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.data ?? []));
  }, [cityId, setValue]);

  useEffect(() => {
    if (!districtId || lines.length === 0) {
      setCosts([]);
      setSelectedShipping(null);
      return;
    }
    const weight = Math.max(1, totalWeightGrams() || 500);
    setCostLoading(true);
    fetch("/api/rajaongkir/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: districtId, weight, courier: COURIER }),
    })
      .then((r) => r.json())
      .then((d) => {
        setCosts((d.data as CostItem[]) ?? []);
        setCostLoading(false);
      })
      .catch(() => setCostLoading(false));
  }, [districtId, lines, totalWeightGrams]);

  const sub = mounted ? subtotal() : 0;
  const shipping = selectedShipping?.cost ?? 0;
  const grandTotal = sub + shipping + SERVICE_FEE;

  const onSubmit = async (values: FormValues) => {
    if (!selectedShipping) {
      setError("Pilih metode pengiriman");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const [firstName, ...rest] = values.fullName.trim().split(/\s+/);
      const lastName = rest.join(" ") || firstName;

      const provinceName =
        provinces.find((p) => String(p.id) === values.provinceId)?.name ?? "";
      const cityName = cities.find((c) => String(c.id) === values.cityId)?.name ?? "";
      const districtName =
        districts.find((d) => String(d.id) === values.districtId)?.name ?? "";

      const shippingTitle = `${selectedShipping.code.toUpperCase()} ${selectedShipping.service}`;

      const customerId =
        accountIsLoggedIn() && accountCustomer ? accountCustomer.id : undefined;

      const res = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            variantId: l.variantId,
            id: l.variantId.split("/").pop()?.slice(0, 50) ?? l.variantId,
            name: l.title,
            price: Math.round(l.priceAmount),
            quantity: l.quantity,
          })),
          shipping,
          shippingTitle,
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: values.email,
            phone: values.phone,
          },
          customerId,
          shippingAddress: {
            firstName,
            lastName,
            phone: values.phone,
            address1: `${values.address}, Kec. ${districtName}, ${cityName}`,
            city: cityName,
            province: provinceName,
            zip: values.postalCode,
            countryCode: "ID",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.redirect_url) {
        throw new Error(json.error || "Gagal membuat transaksi Midtrans");
      }
      window.location.href = json.redirect_url;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return <div className="mx-auto max-w-site px-4 py-12 md:px-8">Loading…</div>;
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-site px-4 py-16 md:px-8">
        <StepIndicator />
        <p className="text-center text-neutral-600">Keranjangmu kosong.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-site px-4 py-10 md:px-8 md:py-14">
      <StepIndicator />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-10 lg:grid-cols-[1fr_420px]"
      >
        <div className="space-y-6">
          <Section title="Kontak">
            <Field label="Email" error={errors.email?.message}>
              <input className={inputCls} {...register("email")} />
            </Field>
            <Field label="Nama Lengkap" error={errors.fullName?.message}>
              <input className={inputCls} {...register("fullName")} />
            </Field>
            <Field label="No. HP" error={errors.phone?.message}>
              <input className={inputCls} {...register("phone")} />
            </Field>
          </Section>

          <Section title="Alamat Pengiriman">
            <Field label="Provinsi" error={errors.provinceId?.message}>
              <select className={inputCls} {...register("provinceId")}>
                <option value="">Pilih provinsi</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Kota / Kabupaten" error={errors.cityId?.message}>
              <select className={inputCls} {...register("cityId")} disabled={!provinceId}>
                <option value="">Pilih kota</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Kecamatan" error={errors.districtId?.message}>
              <select className={inputCls} {...register("districtId")} disabled={!cityId}>
                <option value="">Pilih kecamatan</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Kode Pos" error={errors.postalCode?.message}>
              <input className={inputCls} {...register("postalCode")} />
            </Field>
            <Field label="Alamat Lengkap" error={errors.address?.message}>
              <textarea className={inputCls} rows={3} {...register("address")} />
            </Field>
          </Section>

          <Section title="Metode Pengiriman">
            {!districtId && (
              <p className="text-sm text-neutral-500">Pilih kecamatan terlebih dahulu.</p>
            )}
            {districtId && costLoading && <p className="text-sm text-neutral-500">Menghitung ongkir…</p>}
            {districtId && !costLoading && costs.length === 0 && (
              <p className="text-sm text-neutral-500">Tidak ada layanan tersedia.</p>
            )}
            <div className="space-y-2">
              {costs.map((c, i) => {
                const id = `${c.code}-${c.service}-${i}`;
                const selected = selectedShipping === c;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded border p-3 text-sm ${
                      selected ? "border-brand bg-brand-soft/40" : "border-neutral-200"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selected}
                        onChange={() => setSelectedShipping(c)}
                      />
                      <span>
                        <strong>{c.code.toUpperCase()}</strong> {c.service} ·{" "}
                        <span className="text-neutral-500">{c.etd}</span>
                      </span>
                    </span>
                    <span>{fmtIDR(c.cost)}</span>
                  </label>
                );
              })}
            </div>
          </Section>
        </div>

        {/* YOUR ORDER sidebar */}
        <aside className="h-fit border border-neutral-200 p-6">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#222529]">
            Your Order
          </h2>

          <h3 className="mt-6 border-b border-neutral-200 pb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#222529]">
            Product
          </h3>

          <ul className="space-y-4 border-b border-neutral-200 py-4">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {l.image && (
                    <Image src={l.image} alt={l.title} fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug text-[#222529]">{l.title}</p>
                  <div className="mt-1.5 inline-flex h-7 items-center rounded border border-neutral-300">
                    <button
                      type="button"
                      onClick={() => setQty(l.variantId, l.quantity - 1)}
                      aria-label="Kurangi"
                      className="flex h-full w-7 items-center justify-center text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-[12px] font-semibold tabular-nums">{l.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQty(l.variantId, l.quantity + 1)}
                      aria-label="Tambah"
                      className="flex h-full w-7 items-center justify-center text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => remove(l.variantId)}
                    aria-label={`Hapus ${l.title}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:border-red-400 hover:text-red-600"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-[#222529]">
                    {fmtIDR(l.priceAmount * l.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="text-[14px] text-[#222529]">
            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="font-semibold">Subtotal</span>
              <span>{fmtIDR(sub)}</span>
            </div>
            {selectedShipping && (
              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-neutral-500">
                  Ongkir <span className="text-xs">({selectedShipping.code.toUpperCase()})</span>
                </span>
                <span className="text-neutral-500">{fmtIDR(shipping)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-neutral-500">Biaya Layanan</span>
              <span className="text-neutral-500">{fmtIDR(SERVICE_FEE)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{fmtIDR(grandTotal)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-2 border-t border-neutral-200 pt-5">
            <h3 className="text-[14px] font-semibold text-[#222529]">Payment methods</h3>
            <label className="mt-3 flex items-start gap-3">
              <input
                type="radio"
                name="payment"
                checked
                readOnly
                className="mt-1 accent-[#222529]"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#222529]">Pembayaran via Midtrans</span>
                  <span className="rounded bg-[#1B72E8] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Snap
                  </span>
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-neutral-500">
                  Pembayaran via Virtual Account, QRIS, GoPay/OVO/DANA/ShopeePay, Kartu Kredit, Alfamart/Indomaret, dan lainnya.
                </span>
              </span>
            </label>
          </div>

          <p className="mt-5 border-t border-neutral-200 pt-5 text-[12px] leading-relaxed text-neutral-500">
            Data pribadi Anda akan digunakan untuk memproses pesanan, mendukung pengalaman Anda di website ini, dan untuk keperluan lain seperti dijelaskan di{" "}
            <Link href="/refund-policy" className="text-[#222529] underline">kebijakan privasi</Link>.
          </p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedShipping}
            className="mt-5 inline-flex w-full items-center justify-center rounded bg-[#222529] px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#3a3e44] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Memproses…" : "Place Order"}
          </button>
        </aside>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none disabled:bg-neutral-100";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 p-6">
      <h2 className="mb-4 font-medium">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
