// Maps freeform Indonesian concern names (from Gemini) to existing Shopify
// collection handles used by /product-category/{handle}. Substring matching,
// case-insensitive. Order matters — more specific keywords come first.

const RULES: Array<{ keywords: string[]; handle: string }> = [
  // PIH (post-inflammatory hyperpigmentation = bekas coklat)
  { keywords: ["pih", "hiperpigmentasi", "noda hitam", "noda gelap", "bekas jerawat coklat", "flek"], handle: "pih" },
  // PIE (post-inflammatory erythema = bekas merah)
  { keywords: ["pie", "kemerahan bekas", "bekas jerawat merah", "bekas merah"], handle: "pie" },
  // Acne / breakouts
  { keywords: ["jerawat", "acne", "komedo", "whitehead", "blackhead", "bruntusan"], handle: "acne-prone" },
  // Enlarged pores
  { keywords: ["pori besar", "pori-pori besar", "pori", "pore"], handle: "large-pores" },
  // Sensitive / irritated skin
  { keywords: ["sensitif", "iritasi", "rosacea", "kemerahan"], handle: "sensitive-skin" },
  // General blemish (scarring / dark spots not specifically PIH)
  { keywords: ["bekas luka", "scar", "blemish", "noda"], handle: "blemish" },
];

/**
 * Map a Gemini-emitted concern name to a Shopify collection handle.
 * Returns null when no rule matches — caller should render concern without
 * product recommendations.
 */
export function mapConcernToHandle(name: string): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const { keywords, handle } of RULES) {
    if (keywords.some((k) => n.includes(k))) return handle;
  }
  return null;
}
