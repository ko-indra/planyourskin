import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";

type CartLineInput = { merchandiseId: string; quantity: number };

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!, $note: String) {
    cartCreate(input: { lines: $lines, note: $note }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export async function POST(req: Request) {
  try {
    const { lines, note } = (await req.json()) as { lines: CartLineInput[]; note?: string };
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "lines required" }, { status: 400 });
    }
    const data = await shopifyFetch<{
      cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: Array<{ message: string }> };
    }>(CART_CREATE, { lines, note: note ?? null }, false);
    if (!data.cartCreate.cart) {
      return NextResponse.json(
        { error: data.cartCreate.userErrors.map((e) => e.message).join(", ") || "cart creation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json({ cart: data.cartCreate.cart });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
