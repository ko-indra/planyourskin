import { NextResponse } from "next/server";
import { getCost } from "@/lib/rajaongkir";

const ORIGIN = process.env.ORIGIN_DISTRICT_ID ?? "1344";

export async function POST(req: Request) {
  try {
    const { destination, weight, courier } = await req.json();
    if (!destination || !weight || !courier) {
      return NextResponse.json({ error: "destination, weight, courier required" }, { status: 400 });
    }
    const data = await getCost({
      origin: ORIGIN,
      destination: String(destination),
      weight: Math.max(1, Math.round(Number(weight))),
      courier: String(courier),
    });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
