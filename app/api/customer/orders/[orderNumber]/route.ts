import { NextResponse } from "next/server";
import { fetchCustomerOrder } from "@/lib/shopify";

export async function GET(
  req: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const num = Number(params.orderNumber);
    if (!Number.isInteger(num) || num <= 0) {
      return NextResponse.json({ error: "Invalid order number" }, { status: 400 });
    }

    const order = await fetchCustomerOrder(token, num);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
