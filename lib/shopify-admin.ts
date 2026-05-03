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

// ── Draft Orders ───────────────────────────────────────────────────────

export type DraftOrderLineItem = {
  variantId: string; // gid://shopify/ProductVariant/...
  quantity: number;
};

export type DraftOrderAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  city: string;
  province: string;
  zip: string;
  countryCode: string; // ISO, e.g. "ID"
};

export type CreateDraftOrderInput = {
  email: string;
  phone: string;
  customerId?: string; // gid://shopify/Customer/... — links order to logged-in customer
  lineItems: DraftOrderLineItem[];
  shippingAddress: DraftOrderAddress;
  shippingTitle: string; // e.g. "JNE REG"
  shippingPrice: number; // IDR amount
  serviceFee?: number; // adds custom line item
  note?: string;
  tags?: string[];
  customAttributes?: Array<{ key: string; value: string }>;
};

// Normalize Indonesian phone to E.164 format (Shopify requirement).
// Examples: "081234567890" -> "+6281234567890", "62812..." -> "+62812..."
function normalizePhoneID(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.length === 0) return "";
  return `+62${digits}`;
}

export async function createDraftOrder(
  input: CreateDraftOrderInput
): Promise<{ id: string; name: string; gid: string }> {
  const mutation = /* GraphQL */ `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id name }
        userErrors { field message }
      }
    }
  `;

  const lineItems: Array<Record<string, unknown>> = input.lineItems.map((li) => ({
    variantId: li.variantId,
    quantity: li.quantity,
  }));

  if (input.serviceFee && input.serviceFee > 0) {
    lineItems.push({
      title: "Biaya Layanan",
      originalUnitPrice: input.serviceFee.toString(),
      quantity: 1,
      requiresShipping: false,
      taxable: false,
    });
  }

  const e164Phone = normalizePhoneID(input.phone);
  const e164ShipPhone = normalizePhoneID(input.shippingAddress.phone);

  const variables = {
    input: {
      email: input.email,
      phone: e164Phone,
      ...(input.customerId ? { purchasingEntity: { customerId: input.customerId } } : {}),
      lineItems,
      shippingAddress: {
        firstName: input.shippingAddress.firstName,
        lastName: input.shippingAddress.lastName,
        phone: e164ShipPhone,
        address1: input.shippingAddress.address1,
        city: input.shippingAddress.city,
        province: input.shippingAddress.province,
        zip: input.shippingAddress.zip,
        countryCode: input.shippingAddress.countryCode,
      },
      billingAddress: {
        firstName: input.shippingAddress.firstName,
        lastName: input.shippingAddress.lastName,
        phone: e164ShipPhone,
        address1: input.shippingAddress.address1,
        city: input.shippingAddress.city,
        province: input.shippingAddress.province,
        zip: input.shippingAddress.zip,
        countryCode: input.shippingAddress.countryCode,
      },
      shippingLine: {
        title: input.shippingTitle,
        price: input.shippingPrice.toString(),
      },
      taxExempt: true, // Prices on website are tax-inclusive; Midtrans charges that exact amount
      note: input.note,
      tags: input.tags,
      customAttributes: input.customAttributes,
    },
  };

  const data = await adminFetch<{
    draftOrderCreate: {
      draftOrder: { id: string; name: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, variables);

  const dr = data.draftOrderCreate.draftOrder;
  if (!dr) {
    throw new Error(
      `draftOrderCreate: ${data.draftOrderCreate.userErrors.map((e) => e.message).join("; ")}`
    );
  }
  const numericId = dr.id.split("/").pop() ?? dr.id;
  return { id: numericId, name: dr.name, gid: dr.id };
}

export async function completeDraftOrder(
  draftOrderGid: string
): Promise<{ orderId: string; orderName: string }> {
  const mutation = /* GraphQL */ `
    mutation DraftOrderComplete($id: ID!) {
      draftOrderComplete(id: $id, paymentPending: false) {
        draftOrder {
          order { id name }
        }
        userErrors { field message }
      }
    }
  `;

  const data = await adminFetch<{
    draftOrderComplete: {
      draftOrder: { order: { id: string; name: string } | null } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, { id: draftOrderGid });

  const order = data.draftOrderComplete.draftOrder?.order;
  if (!order) {
    throw new Error(
      `draftOrderComplete: ${data.draftOrderComplete.userErrors.map((e) => e.message).join("; ")}`
    );
  }
  return { orderId: order.id, orderName: order.name };
}

// ── Wishlist (existing) ────────────────────────────────────────────────

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
