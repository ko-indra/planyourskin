import { NextResponse } from "next/server";
import { getProductByHandleWithVariant } from "@/lib/shopify";

// GET /api/skin-analyzer/product?handle=all-at-once-gel-moisturizer
// Returns a single product with firstVariant. Used by RoutineProducts to
// fetch each AI-suggested product's live Shopify data for Add-to-Cart.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle")?.trim() ?? "";
    if (!handle) {
      return NextResponse.json({ error: "handle required" }, { status: 400 });
    }
    const product = await getProductByHandleWithVariant(handle);
    if (!product) {
      return NextResponse.json({ product: null }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
