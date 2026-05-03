import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/rajaongkir";

export async function GET() {
  try {
    const data = await getProvinces();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
