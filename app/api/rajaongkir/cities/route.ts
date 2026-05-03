import { NextResponse } from "next/server";
import { getCities } from "@/lib/rajaongkir";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const province = searchParams.get("province");
  if (!province) return NextResponse.json({ error: "province required" }, { status: 400 });
  try {
    const data = await getCities(province);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
