import { NextResponse } from "next/server";
import { fetchCustomer } from "@/lib/shopify";
import { getCustomerWishlist, setCustomerWishlist } from "@/lib/shopify-admin";

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function authenticate(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;
  return fetchCustomer(token);
}

export async function GET(req: Request) {
  try {
    const customer = await authenticate(req);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const productIds = await getCustomerWishlist(customer.id);
    return NextResponse.json({ productIds });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const customer = await authenticate(req);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const productId = typeof body?.productId === "string" ? body.productId : null;
    const action = body?.action as "add" | "remove" | "toggle" | undefined;
    if (!productId || !action) {
      return NextResponse.json({ error: "productId and action required" }, { status: 400 });
    }

    const current = await getCustomerWishlist(customer.id);
    let next: string[];
    if (action === "add") {
      next = current.includes(productId) ? current : [...current, productId];
    } else if (action === "remove") {
      next = current.filter((id) => id !== productId);
    } else if (action === "toggle") {
      next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await setCustomerWishlist(customer.id, next);
    return NextResponse.json({ productIds: next });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
