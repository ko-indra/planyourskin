import { NextResponse } from "next/server";
import { customerLogin } from "@/lib/shopify";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }
    const result = await customerLogin(String(email), String(password));
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0]?.message || "Login failed", errors: result.errors }, { status: 401 });
    }
    return NextResponse.json({
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      customer: result.customer,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
