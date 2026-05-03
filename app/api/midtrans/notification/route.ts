import { NextResponse } from "next/server";
import { fetchTransactionStatus, verifyMidtransSignature } from "@/lib/midtrans";
import { completeDraftOrder } from "@/lib/shopify-admin";

const SUCCESS_STATUSES = new Set(["capture", "settlement"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string | undefined>;
    const orderId = body.order_id;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;
    const signatureKey = body.signature_key;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
    }

    // Verify signature
    if (!verifyMidtransSignature(orderId, statusCode, grossAmount, signatureKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Defense in depth: re-fetch status from Midtrans
    const status = await fetchTransactionStatus(orderId);
    const txStatus = status.transaction_status;
    const fraud = status.fraud_status;

    const isSuccess =
      SUCCESS_STATUSES.has(txStatus) && (fraud === "accept" || !fraud);

    if (!isSuccess) {
      // Log but don't error — Midtrans expects 200 for non-success statuses too
      // (pending, expire, deny, cancel, etc.)
      return NextResponse.json({ ok: true, action: "noop", txStatus, fraud });
    }

    // Get draft order GID from custom_field1
    const draftOrderGid = status.custom_field1;
    if (!draftOrderGid) {
      return NextResponse.json(
        { error: "No draft order GID in custom_field1" },
        { status: 500 }
      );
    }

    // Complete the draft order in Shopify (idempotent — Midtrans may retry)
    try {
      const completed = await completeDraftOrder(draftOrderGid);
      return NextResponse.json({
        ok: true,
        action: "completed",
        orderId: completed.orderId,
        orderName: completed.orderName,
      });
    } catch (e) {
      const msg = (e as Error).message.toLowerCase();
      if (
        msg.includes("not open") ||
        msg.includes("already") ||
        msg.includes("completed")
      ) {
        return NextResponse.json({ ok: true, action: "already-completed" });
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
