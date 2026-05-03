// Server-only Midtrans Snap client.
import crypto from "crypto";

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Pick keys matching the active environment. Falls back to legacy MIDTRANS_SERVER_KEY
// for backwards compat with older .env layouts.
const SERVER_KEY = IS_PRODUCTION
  ? process.env.MIDTRANS_PROD_SERVER_KEY ?? process.env.MIDTRANS_SERVER_KEY ?? ""
  : process.env.MIDTRANS_SANDBOX_SERVER_KEY ?? process.env.MIDTRANS_SERVER_KEY ?? "";

const SNAP_BASE = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const STATUS_BASE = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  if (!SERVER_KEY) return false;
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + SERVER_KEY)
    .digest("hex");
  return expected === signatureKey;
}

export type MidtransStatus = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  status_code: string;
  gross_amount: string;
  payment_type?: string;
  signature_key?: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
};

export async function fetchTransactionStatus(orderId: string): Promise<MidtransStatus> {
  if (!SERVER_KEY) throw new Error("MIDTRANS server key is not set");
  const auth = Buffer.from(`${SERVER_KEY}:`).toString("base64");
  const res = await fetch(`${STATUS_BASE}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Midtrans status: ${json.status_message || res.status}`);
  }
  return json as MidtransStatus;
}

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
  finishUrl?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
};

export type SnapResult = { token: string; redirect_url: string };

export async function createSnapTransaction(t: SnapTransaction): Promise<SnapResult> {
  if (!SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY is not set");

  const auth = Buffer.from(`${SERVER_KEY}:`).toString("base64");
  const body: Record<string, unknown> = {
    transaction_details: {
      order_id: t.order_id,
      gross_amount: t.gross_amount,
    },
    item_details: t.items,
    customer_details: t.customer ?? {},
    credit_card: { secure: true },
  };
  if (t.finishUrl) body.callbacks = { finish: t.finishUrl };
  if (t.customField1) body.custom_field1 = t.customField1;
  if (t.customField2) body.custom_field2 = t.customField2;
  if (t.customField3) body.custom_field3 = t.customField3;

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
