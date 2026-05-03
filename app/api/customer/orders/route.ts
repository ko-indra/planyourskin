import { NextResponse } from "next/server";
import { fetchCustomerOrders } from "@/lib/shopify";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orders = await fetchCustomerOrders(token);
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
