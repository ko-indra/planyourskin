const RO_KEY = process.env.RAJAONGKIR_API_KEY!;
const RO_BASE = "https://rajaongkir.komerce.id/api/v1";

export type Province = { id: number; name: string };
export type City = { id: number; name: string };
export type District = { id: number; name: string; zip_code?: string };
export type CostItem = {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

type Envelope<T> = {
  meta: { message: string; code: number; status: string };
  data: T;
};

async function roFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!RO_KEY) throw new Error("Missing RAJAONGKIR_API_KEY");
  const res = await fetch(`${RO_BASE}${path}`, {
    ...init,
    headers: { key: RO_KEY, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || json.meta?.code !== 200) {
    throw new Error(`RajaOngkir: ${json.meta?.message ?? res.statusText}`);
  }
  return json.data;
}

export const getProvinces = () => roFetch<Province[]>("/destination/province");
export const getCities = (provinceId: string | number) =>
  roFetch<City[]>(`/destination/city/${provinceId}`);
export const getDistricts = (cityId: string | number) =>
  roFetch<District[]>(`/destination/district/${cityId}`);

export async function getCost(params: {
  origin: string | number;
  destination: string | number;
  weight: number;
  courier: string;
}): Promise<CostItem[]> {
  const body = new URLSearchParams({
    origin: String(params.origin),
    destination: String(params.destination),
    weight: String(params.weight),
    courier: params.courier,
    price: "lowest",
  });
  return roFetch<CostItem[]>("/calculate/district/domestic-cost", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}
