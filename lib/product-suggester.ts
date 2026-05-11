// Server-only product suggester. Calls Gemini a second time with the skin
// analysis + Plan Your Skin product catalog and asks for 2-3 best-fit
// product recommendations from a fixed registry of 5 productIds.
// Ported from the standalone skin-analyzer/lib/product-suggester.js (v2).

import fs from "node:fs/promises";
import path from "node:path";
import type { SkinAnalysis } from "./gemini";

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const KNOWLEDGE_PATH = path.join(process.cwd(), "lib", "skin-analyzer", "product-knowledge.txt");

let cachedKnowledge: string | null = null;
async function getKnowledge(): Promise<string> {
  if (cachedKnowledge) return cachedKnowledge;
  cachedKnowledge = await fs.readFile(KNOWLEDGE_PATH, "utf8");
  return cachedKnowledge;
}

// Stable product IDs that the frontend uses to look up Shopify products.
// Gemini must respond with exactly these IDs.
export const PRODUCT_REGISTRY = {
  "gel-moisturizer": "All At Once Gel Moisturizer",
  "water-cream": "All At Once Water Cream",
  "hpr-serum": "All Night HPR Retinoate Repair Serum",
  "spf-sun-cream": "UV Protector Hybrid Sun Cream with Niacinamide",
  "cleansing-serum": "Cleansing Serum Cleansing Me Gently",
} as const;

export type ProductId = keyof typeof PRODUCT_REGISTRY;

export type ProductSuggestion = {
  productId: ProductId;
  name: string;
  tagline: string;
  reason: string;
  matchPercent: number;
  primaryBenefit: string;
};

export type SuggestionsResponse = {
  suggestions: ProductSuggestion[];
};

function buildPrompt(analysis: SkinAnalysis, knowledge: string): string {
  const flag = (v: number) => (v < 60 ? "(rendah/perlu dibantu)" : "(baik)");
  return `Kamu adalah ahli skincare AI yang merekomendasikan produk Plan Your Skin berdasarkan hasil analisis kulit pengguna.

HASIL ANALISIS KULIT PENGGUNA (skor 0-100, semakin TINGGI semakin BAIK):
- Overall Score: ${analysis.overallScore}
- Skin Type: ${analysis.skinType}
- Moisture (Kelembapan): ${analysis.moisture} ${flag(analysis.moisture)}
- Blemish/Acne (Beruntusan): ${analysis.blemish} ${flag(analysis.blemish)}
- PIE (Kemerahan pasca jerawat): ${analysis.pie} ${flag(analysis.pie)}
- PIH (Bekas hitam pasca inflamasi): ${analysis.pih} ${flag(analysis.pih)}
- Fine Lines (Garis Halus): ${analysis.fineLines} ${flag(analysis.fineLines)}

KATALOG PRODUK PLAN YOUR SKIN (gunakan HANYA produk berikut):
${knowledge}

TUGAS:
Pilih 2-3 produk yang PALING COCOK untuk kondisi kulit pengguna ini, urutkan dari yang paling penting. Prioritaskan parameter dengan skor terendah (paling perlu dibantu). Setiap rekomendasi harus didasarkan pada bagian "REKOMENDASI BERDASARKAN KONDISI KULIT" dalam katalog plus kondisi spesifik dari skor.

Kembalikan JSON murni dengan format:
{
  "suggestions": [
    {
      "productId": "<salah satu dari: gel-moisturizer | water-cream | hpr-serum | spf-sun-cream | cleansing-serum>",
      "name": "<nama produk lengkap>",
      "tagline": "<satu kalimat pendek menjelaskan benefit utama, maks 60 karakter>",
      "reason": "<2-3 kalimat dalam bahasa Indonesia menjelaskan mengapa produk ini cocok untuk kondisi kulit pengguna, sebut parameter spesifik yang akan terbantu>",
      "matchPercent": <angka 60-100, menunjukkan seberapa cocok produk ini dengan kondisi kulit pengguna>,
      "primaryBenefit": "<1-3 kata, contoh: 'Hidrasi', 'Anti-Aging', 'PIH Care', 'SPF Protection', 'Cleansing'>"
    }
  ]
}

PENTING:
- HANYA gunakan productId yang ada dalam list (5 ID di atas)
- Jangan rekomendasikan produk di luar katalog
- Urutan rekomendasi = urutan prioritas (paling penting di atas)
- Bahasa Indonesia yang natural dan ramah
- Hanya output JSON murni, tidak ada teks tambahan, tidak ada markdown code block`;
}

export async function suggestProducts(analysis: SkinAnalysis): Promise<SuggestionsResponse> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const knowledge = await getKnowledge();
  const prompt = buildPrompt(analysis, knowledge);

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      error?: { message?: string };
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    if (!res.ok) {
      throw new Error(`Gemini API error: ${json.error?.message ?? res.statusText}`);
    }

    const finishReason = json.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      lastError = new Error("Response truncated, retrying");
      continue;
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini API");

    let raw = text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    try {
      const parsed = JSON.parse(raw) as SuggestionsResponse;
      // Filter out any productIds not in registry
      parsed.suggestions = (parsed.suggestions ?? []).filter(
        (s): s is ProductSuggestion => s.productId in PRODUCT_REGISTRY
      );
      return parsed;
    } catch (e) {
      lastError = new Error(`Failed to parse Gemini response: ${(e as Error).message}`);
    }
  }
  throw lastError ?? new Error("Suggester failed");
}
