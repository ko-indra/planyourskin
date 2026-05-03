import { NextResponse } from "next/server";
import { customerRegister } from "@/lib/shopify";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }
    const result = await customerRegister({
      email: String(email),
      password: String(password),
      firstName: firstName ? String(firstName) : undefined,
      lastName: lastName ? String(lastName) : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0]?.message || "Registration failed", errors: result.errors }, { status: 400 });
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
