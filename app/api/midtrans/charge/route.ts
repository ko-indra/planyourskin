import { NextResponse } from "next/server";
import { createSnapTransaction, type SnapItem, type SnapCustomer } from "@/lib/midtrans";
import { createDraftOrder, type DraftOrderAddress } from "@/lib/shopify-admin";

const SERVICE_FEE = 2500;

type ChargeBody = {
  items: Array<{ id: string; name: string; price: number; quantity: number; variantId: string }>;
  shipping: number;
  shippingTitle: string; // e.g. "JNE REG"
  customer: SnapCustomer;
  customerId?: string; // gid://shopify/Customer/... when user is logged in
  shippingAddress: DraftOrderAddress;
};

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChargeBody;
    const items = Array.isArray(body?.items) ? body.items : [];
    const shipping = Math.max(0, Number(body?.shipping ?? 0) || 0);
    const shippingTitle = body?.shippingTitle || "Pengiriman";
    const customer = body?.customer ?? {};
    const shippingAddress = body?.shippingAddress;

    if (items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: "shippingAddress required" }, { status: 400 });
    }

    const itemsSubtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const grossAmount = itemsSubtotal + shipping + SERVICE_FEE;

    // 1) Create Shopify draft order
    const draft = await createDraftOrder({
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      customerId: body?.customerId,
      lineItems: items.map((it) => ({ variantId: it.variantId, quantity: it.quantity })),
      shippingAddress,
      shippingTitle,
      shippingPrice: shipping,
      serviceFee: SERVICE_FEE,
      tags: ["midtrans", "pending-payment"],
      note: `Order created via Midtrans Snap. Pending payment confirmation.`,
    });

    // 2) Create Midtrans Snap transaction
    const orderId = `pys-${draft.id}-${Math.random().toString(36).slice(2, 6)}`;
    const snapItems: SnapItem[] = [...items.map((it) => ({
      id: it.id,
      name: it.name.slice(0, 50),
      price: Math.round(it.price),
      quantity: it.quantity,
    }))];
    if (shipping > 0) {
      snapItems.push({ id: "SHIPPING", name: shippingTitle.slice(0, 50), price: shipping, quantity: 1 });
    }
    snapItems.push({ id: "SERVICE_FEE", name: "Biaya Layanan", price: SERVICE_FEE, quantity: 1 });

    const origin = getOrigin(req);
    const finishUrl = `${origin}/checkout/success?order_id=${encodeURIComponent(orderId)}`;
    const notificationUrl = `${origin}/api/midtrans/notification`;

    const result = await createSnapTransaction({
      order_id: orderId,
      gross_amount: grossAmount,
      items: snapItems,
      customer,
      finishUrl,
      notificationUrl,
      customField1: draft.gid, // shopify draft order GID, used by webhook
      customField2: draft.name, // e.g. "#D123" for display
    });

    return NextResponse.json({
      orderId,
      shopifyDraftId: draft.id,
      shopifyDraftName: draft.name,
      ...result,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
