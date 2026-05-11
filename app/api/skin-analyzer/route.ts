import { NextResponse } from "next/server";
import { analyzeSkin } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

// Per-IP rate limit: in-memory LRU. Suitable for low traffic / Hobby Vercel.
// Replace with Upstash or Vercel KV for production scale (cross-region).
type Bucket = { count: number; resetAt: number };
const LIMITS = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = LIMITS.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    LIMITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";

    const limit = rateLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const body = (await req.json()) as { image?: string };
    const image = body?.image;
    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    if (image.length > 2_500_000) {
      return NextResponse.json({ error: "Gambar terlalu besar" }, { status: 413 });
    }

    const analysis = await analyzeSkin(image);
    return NextResponse.json({ ok: true, analysis });
  } catch (e) {
    const msg = (e as Error).message || "Gagal menganalisis kulit";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
