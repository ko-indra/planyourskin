export function statusLabel(s: string | null): { text: string; cls: string } {
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

export const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
