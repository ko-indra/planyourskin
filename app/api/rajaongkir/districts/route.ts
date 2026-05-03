import { NextResponse } from "next/server";
import { getDistricts } from "@/lib/rajaongkir";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });
  try {
    const data = await getDistricts(city);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
