import { NextResponse } from "next/server";
import { getCollectionProductsWithVariant } from "@/lib/shopify";

// GET /api/skin-analyzer/products?handle=acne-prone&limit=3
// Thin wrapper over getCollectionProductsWithVariant — used by ResultModal
// to render 2-3 product mini-cards per concern with Add to Cart.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle")?.trim() ?? "";
    const limit = Math.min(6, Math.max(1, Number(searchParams.get("limit") ?? "3")));

    if (!handle) {
      return NextResponse.json({ error: "handle required" }, { status: 400 });
    }

    const products = await getCollectionProductsWithVariant(handle, limit);
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
