// Server-only Midtrans Snap client.
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Pick keys matching the active environment. Falls back to legacy MIDTRANS_SERVER_KEY
// for backwards compat with older .env layouts.
const SERVER_KEY = IS_PRODUCTION
  ? process.env.MIDTRANS_PROD_SERVER_KEY ?? process.env.MIDTRANS_SERVER_KEY ?? ""
  : process.env.MIDTRANS_SANDBOX_SERVER_KEY ?? process.env.MIDTRANS_SERVER_KEY ?? "";

const SNAP_BASE = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

export type SnapItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type SnapCustomer = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
};

export type SnapTransaction = {
  order_id: string;
  gross_amount: number;
  items: SnapItem[];
  customer?: SnapCustomer;
};

export type SnapResult = { token: string; redirect_url: string };

export async function createSnapTransaction(t: SnapTransaction): Promise<SnapResult> {
  if (!SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY is not set");

  const auth = Buffer.from(`${SERVER_KEY}:`).toString("base64");
  const body = {
    transaction_details: {
      order_id: t.order_id,
      gross_amount: t.gross_amount,
    },
    item_details: t.items,
    customer_details: t.customer ?? {},
    credit_card: { secure: true },
  };

  const res = await fetch(`${SNAP_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.token) {
    const msg = Array.isArray(json.error_messages)
      ? json.error_messages.join("; ")
      : json.message || `Midtrans HTTP ${res.status}`;
    throw new Error(`Midtrans Snap: ${msg}`);
  }

  return { token: json.token, redirect_url: json.redirect_url };
}
