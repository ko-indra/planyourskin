"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart-store";
import type { Province, City, District, CostItem } from "@/lib/rajaongkir";

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

const COURIER = "jne:tiki:pos:sicepat:jnt:anteraja";
const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function CheckoutPage() {
  const { lines, subtotal, totalWeightGrams } = useCart();
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
  const grandTotal = sub + (selectedShipping?.cost ?? 0);

  const onSubmit = async (values: FormValues) => {
    if (!selectedShipping) {
      setError("Pilih metode pengiriman");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const province = provinces.find((p) => String(p.id) === values.provinceId)?.name ?? "";
      const city = cities.find((c) => String(c.id) === values.cityId)?.name ?? "";
      const district = districts.find((d) => String(d.id) === values.districtId)?.name ?? "";
      const note = [
        `Nama: ${values.fullName}`,
        `Telp: ${values.phone}`,
        `Email: ${values.email}`,
        `Alamat: ${values.address}`,
        `Kec. ${district}, ${city}, ${province} ${values.postalCode}`,
        `Kurir: ${selectedShipping.code.toUpperCase()} ${selectedShipping.service} - ${formatIDR(selectedShipping.cost)} (ETD ${selectedShipping.etd})`,
      ].join("\n");

      const res = await fetch("/api/shopify/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })),
          note,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.cart?.checkoutUrl) {
        throw new Error(json.error || "Gagal membuat cart Shopify");
      }
      window.location.href = json.cart.checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (!mounted) return <div className="mx-auto max-w-site px-4 py-12 md:px-8">Loading…</div>;
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-site px-4 py-20 text-center md:px-8">
        <p>Keranjangmu kosong.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-site px-4 py-12 md:px-8">
      <h1 className="mb-8 font-display text-3xl md:text-4xl">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 md:grid-cols-[1fr_360px]">
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
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kota / Kabupaten" error={errors.cityId?.message}>
              <select className={inputCls} {...register("cityId")} disabled={!provinceId}>
                <option value="">Pilih kota</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kecamatan" error={errors.districtId?.message}>
              <select className={inputCls} {...register("districtId")} disabled={!cityId}>
                <option value="">Pilih kecamatan</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
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
                      selected ? "border-brand-accent bg-brand-soft/40" : "border-neutral-200"
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
                    <span>{formatIDR(c.cost)}</span>
                  </label>
                );
              })}
            </div>
          </Section>
        </div>

        <aside className="h-fit space-y-4 rounded-lg border border-neutral-200 bg-brand-soft/40 p-6">
          <h2 className="font-medium">Ringkasan Order</h2>
          <ul className="divide-y divide-neutral-200/70 text-sm">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-3 py-2">
                <span className="flex-1">
                  {l.title}
                  <span className="text-neutral-500"> × {l.quantity}</span>
                </span>
                <span>{formatIDR(l.priceAmount * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-neutral-200/70 pt-3 text-sm">
            <Row label="Subtotal" value={formatIDR(sub)} />
            <Row label="Ongkir" value={selectedShipping ? formatIDR(selectedShipping.cost) : "-"} />
            <Row label="Total" value={formatIDR(grandTotal)} bold />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !selectedShipping}
            className="w-full rounded-full bg-brand px-8 py-3 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Memproses…" : "Bayar Sekarang"}
          </button>
          <p className="text-xs text-neutral-500">
            Kamu akan diarahkan ke halaman pembayaran Shopify yang aman.
          </p>
        </aside>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:bg-neutral-100";

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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
