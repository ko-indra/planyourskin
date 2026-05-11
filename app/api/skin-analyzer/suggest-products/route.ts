import { NextResponse } from "next/server";
import { suggestProducts } from "@/lib/product-suggester";
import type { SkinAnalysis } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/skin-analyzer/suggest-products
// Body: { analysis: SkinAnalysis }
// Returns { suggestions: ProductSuggestion[] }
//
// Called from the result screen after analyzeSkin returns. Runs a second
// Gemini call against the Plan Your Skin product catalog to produce a
// personalized routine of 2-3 products.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { analysis?: SkinAnalysis };
    if (!body?.analysis || typeof body.analysis !== "object") {
      return NextResponse.json({ error: "Missing analysis payload" }, { status: 400 });
    }
    const result = await suggestProducts(body.analysis);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Gagal merekomendasikan produk" },
      { status: 500 }
    );
  }
}
