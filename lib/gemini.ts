// Server-only Gemini 2.5-flash client. Do NOT import from client components.
// Ported from the standalone skin-analyzer/lib/gemini.js (same Indonesian prompt).

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type SkinConcern = {
  name: string;
  severity: "rendah" | "sedang" | "tinggi" | string;
  icon: string;
  description: string;
};

export type SkinAnalysis = {
  overallScore: number;
  skinType: string;
  hydrationLevel: string;
  concerns: SkinConcern[];
  strengths: string[];
  recommendations: string[];
  summary: string;
};

const PROMPT = `Kamu adalah seorang ahli dermatologi AI profesional. Analisis foto wajah ini dan berikan penilaian kulit yang komprehensif.

Berikan response dalam format JSON berikut (HANYA JSON murni, tanpa markdown code block atau teks lain):
{
  "overallScore": <angka 0-100>,
  "skinType": "<Berminyak/Kering/Kombinasi/Normal/Sensitif>",
  "hydrationLevel": "<Rendah/Sedang/Baik/Sangat Baik>",
  "concerns": [
    {"name": "<nama masalah>", "severity": "<rendah/sedang/tinggi>", "icon": "<emoji>", "description": "<penjelasan 1-2 kalimat>"}
  ],
  "strengths": ["<kelebihan 1>", "<kelebihan 2>"],
  "recommendations": ["<saran 1>", "<saran 2>", "<saran 3>"],
  "summary": "<ringkasan kondisi kulit 2-3 kalimat bahasa Indonesia>"
}

Penting:
- Penilaian jujur dan profesional
- overallScore realistis
- Minimal 2 concerns dan 3 recommendations
- Semua teks dalam bahasa Indonesia`;

export async function analyzeSkin(imageDataUrl: string): Promise<SkinAnalysis> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const mimeType = match[1];
  const base64 = match[2];

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  // Up to 2 attempts on parse/MAX_TOKENS issues.
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
      return JSON.parse(raw) as SkinAnalysis;
    } catch (e) {
      lastError = new Error(`Failed to parse Gemini response: ${(e as Error).message}`);
    }
  }
  throw lastError ?? new Error("Gemini analysis failed");
}
