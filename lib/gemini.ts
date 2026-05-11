// Server-only Gemini 2.5-flash client. Do NOT import from client components.
// Ported from skin-analyzer/lib/gemini.js (v2 — 5 parameter scoring).

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type SkinConcern = {
  name: string;
  severity: "rendah" | "sedang" | "tinggi" | string;
  icon: string;
  description: string;
};

// Convention: ALL scores are 0–100 where 100 = ideal/perfect, 0 = worst.
export type SkinAnalysis = {
  overallScore: number;
  skinType: string;

  moisture: number;
  moistureDesc: string;
  blemish: number;
  blemishDesc: string;
  pie: number;
  pieDesc: string;
  pih: number;
  pihDesc: string;
  fineLines: number;
  fineLinesDesc: string;

  summary: string;
  concerns: SkinConcern[];
  recommendations: string[];
};

const PROMPT = `Kamu adalah seorang ahli dermatologi AI profesional. Analisis foto wajah ini dan berikan penilaian kulit yang komprehensif dengan 5 parameter spesifik.

KONVENSI SKOR PENTING:
Untuk SEMUA parameter (overallScore, moisture, blemish, pie, pih, fineLines):
- 100 = kondisi SEMPURNA / IDEAL
- 0 = kondisi paling BURUK
- Semakin TINGGI angkanya, semakin BAIK kondisi kulit untuk parameter tersebut
- Jika kulit sempurna tanpa cacat, semua skor harus mendekati 100
- Jika kulit memiliki masalah, skornya menjadi rendah sesuai keparahan

Berikan response dalam format JSON berikut (HANYA JSON murni, tanpa markdown code block atau teks lain):
{
  "overallScore": <0-100, kesehatan kulit keseluruhan; 100 = sempurna>,
  "skinType": "<Berminyak|Kering|Kombinasi|Normal|Sensitif>",

  "moisture": <0-100; 100 = sangat lembap & terhidrasi sempurna, 0 = sangat kering>,
  "moistureDesc": "<1-2 kalimat deskripsi kelembapan kulit>",

  "blemish": <0-100; 100 = kulit BERSIH total tanpa jerawat/beruntusan, 0 = banyak jerawat parah>,
  "blemishDesc": "<1-2 kalimat deskripsi kondisi jerawat/beruntusan>",

  "pie": <0-100; 100 = TIDAK ADA kemerahan pasca jerawat, 0 = PIE sangat parah>,
  "pieDesc": "<1-2 kalimat deskripsi kemerahan pasca jerawat>",

  "pih": <0-100; 100 = TIDAK ADA bekas hitam/hiperpigmentasi, 0 = PIH sangat parah>,
  "pihDesc": "<1-2 kalimat deskripsi pigmentasi/bekas hitam>",

  "fineLines": <0-100; 100 = kulit MULUS tanpa garis halus, 0 = banyak garis halus/kerutan>,
  "fineLinesDesc": "<1-2 kalimat deskripsi garis halus>",

  "summary": "<ringkasan kondisi kulit 3-4 kalimat dalam bahasa Indonesia, sopan dan informatif>",

  "concerns": [
    {"name": "<nama masalah>", "severity": "<rendah|sedang|tinggi>", "icon": "<emoji>", "description": "<penjelasan 1-2 kalimat>"}
  ],

  "recommendations": ["<saran perawatan 1>", "<saran perawatan 2>", "<saran perawatan 3>", "<saran perawatan 4>"]
}

PENTING:
- Penilaian harus jujur, profesional, dan akurat berdasarkan apa yang terlihat di foto
- Konsisten: SEMUA skor mengikuti aturan "tinggi = baik", "rendah = buruk"
- overallScore = rata-rata tertimbang yang mencerminkan kondisi keseluruhan
- Jika tidak terlihat masalah pada satu parameter, beri skor TINGGI (90-100), bukan rendah
- Berikan minimal 2 concerns (jika ada masalah) dan minimal 3 rekomendasi
- Semua deskripsi dan saran dalam bahasa Indonesia yang ramah dan profesional
- Jangan tambahkan teks apapun di luar JSON`;

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
