// Server-only Admin API client. Do not import from client components.
const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const ADMIN_TOKEN = process.env.SHOPIFY_API_KEY!;
const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2024-10";

const ADMIN_ENDPOINT = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`;

type GqlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!SHOPIFY_STORE || !ADMIN_TOKEN) {
    throw new Error("Missing SHOPIFY_STORE or SHOPIFY_API_KEY env vars");
  }
  const res = await fetch(ADMIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Shopify Admin HTTP ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as GqlResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GraphQL: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  return json.data as T;
}

const WISHLIST_NAMESPACE = "pys";
const WISHLIST_KEY = "wishlist";

export async function getCustomerWishlist(customerId: string): Promise<string[]> {
  const query = /* GraphQL */ `
    query CustomerWishlist($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "${WISHLIST_NAMESPACE}", key: "${WISHLIST_KEY}") {
          value
        }
      }
    }
  `;
  const data = await adminFetch<{ customer: { metafield: { value: string } | null } | null }>(query, { id: customerId });
  const raw = data.customer?.metafield?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setCustomerWishlist(customerId: string, productIds: string[]): Promise<void> {
  const mutation = /* GraphQL */ `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }
  `;
  const result = await adminFetch<{
    metafieldsSet: {
      metafields: Array<{ id: string }>;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, {
    metafields: [
      {
        ownerId: customerId,
        namespace: WISHLIST_NAMESPACE,
        key: WISHLIST_KEY,
        type: "list.product_reference",
        value: JSON.stringify(productIds),
      },
    ],
  });
  if (result.metafieldsSet.userErrors.length) {
    throw new Error(
      `metafieldsSet: ${result.metafieldsSet.userErrors.map((e) => e.message).join(", ")}`
    );
  }
}
