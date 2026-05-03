import { NextResponse } from "next/server";
import { fetchCustomer, getProductsByIds } from "@/lib/shopify";
import { getCustomerWishlist } from "@/lib/shopify-admin";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await fetchCustomer(token);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const productIds = await getCustomerWishlist(customer.id);
    const products = productIds.length ? await getProductsByIds(productIds) : [];
    return NextResponse.json({ productIds, products });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
