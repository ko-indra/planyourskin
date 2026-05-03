import { NextResponse } from "next/server";
import { customerLogout } from "@/lib/shopify";

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "accessToken required" }, { status: 400 });
    }
    const result = await customerLogout(String(accessToken));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
