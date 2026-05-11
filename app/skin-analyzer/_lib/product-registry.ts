// Maps the Gemini suggester's productId → Shopify product handle.
// These handles MUST match the products in your Shopify catalog. If a handle
// is wrong, the RoutineProducts card falls back gracefully (renders the
// suggestion's reason/tagline without Add-to-Cart). Edit values to match
// your real product slugs.

import type { ProductId } from "@/lib/product-suggester";

export const PRODUCT_HANDLES: Record<ProductId, string> = {
  "gel-moisturizer": "all-at-once-gel-moisturizer",
  "water-cream": "all-at-once-water-cream",
  "hpr-serum": "plan-your-skin-all-night-hpr-retinoate-repair-serum",
  "spf-sun-cream": "plan-your-skin-spf-50-pa-niacinamide-hybrid-uv-protector-approve-by-bpom",
  "cleansing-serum": "cleansing-serum-facial-cleanser-lembut-hapus-makeup-kotoran-deep-cleansing-aman-untuk-kulit-sensitif-melembapkan-24-jam",
};
