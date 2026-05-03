import { NextResponse } from "next/server";
import { createSnapTransaction, type SnapItem, type SnapCustomer } from "@/lib/midtrans";

const SERVICE_FEE = 2500;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: SnapItem[] = Array.isArray(body?.items) ? body.items : [];
    const shipping = Number(body?.shipping ?? 0) || 0;
    const customer: SnapCustomer = body?.customer ?? {};

    if (items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const itemsSubtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const grossAmount = itemsSubtotal + shipping + SERVICE_FEE;

    const allItems: SnapItem[] = [...items];
    if (shipping > 0) {
      allItems.push({ id: "SHIPPING", name: "Ongkos Kirim", price: shipping, quantity: 1 });
    }
    allItems.push({ id: "SERVICE_FEE", name: "Biaya Layanan", price: SERVICE_FEE, quantity: 1 });

    const orderId = `pys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await createSnapTransaction({
      order_id: orderId,
      gross_amount: grossAmount,
      items: allItems,
      customer,
    });

    return NextResponse.json({ orderId, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
