const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN!;
const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2024-10";

const ENDPOINT = `https://${SHOPIFY_STORE}/api/${API_VERSION}/graphql.json`;

type GqlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate: number | false = 60
): Promise<T> {
  if (!SHOPIFY_STORE || !TOKEN) {
    throw new Error("Missing SHOPIFY_STORE or SHOPIFY_STOREFRONT_TOKEN env vars");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as GqlResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  return json.data as T;
}

// ── Types ──────────────────────────────────────────────────────────────
export type Money = { amount: string; currencyCode: string };
export type Image = { url: string; altText: string | null; width: number; height: number };

export type ProductSummary = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  featuredImage: Image | null;
  previewImages: { edges: Array<{ node: Image }> };
  tags: string[];
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money };
  collections: { edges: Array<{ node: { title: string } }> };
};

export type ProductDetail = ProductSummary & {
  description: string;
  descriptionHtml: string;
  images: { edges: Array<{ node: Image }> };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string | null;
        availableForSale: boolean;
        price: Money;
        compareAtPrice: Money | null;
        weight: number; // in unit below
        weightUnit: "GRAMS" | "KILOGRAMS" | "OUNCES" | "POUNDS";
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
  options: Array<{ name: string; values: string[] }>;
};

// ── Queries ────────────────────────────────────────────────────────────
const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    vendor
    productType
    featuredImage { url altText width height }
    previewImages: images(first: 2) { edges { node { url altText width height } } }
    tags
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    collections(first: 2) { edges { node { title } } }
  }
`;

export async function getProducts(first = 12): Promise<ProductSummary[]> {
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Products($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ...ProductFields } }
      }
    }
  `;
  const data = await shopifyFetch<{ products: { edges: Array<{ node: ProductSummary }> } }>(
    query,
    { first }
  );
  return data.products.edges.map((e) => e.node);
}

export async function getProductByHandle(handle: string): Promise<ProductDetail | null> {
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Product($handle: String!) {
      product(handle: $handle) {
        ...ProductFields
        description
        descriptionHtml
        images(first: 10) { edges { node { url altText width height } } }
        options { name values }
        variants(first: 50) {
          edges {
            node {
              id
              title
              sku
              availableForSale
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              weight
              weightUnit
              selectedOptions { name value }
            }
          }
        }
      }
    }
  `;
  const data = await shopifyFetch<{ product: ProductDetail | null }>(query, { handle });
  return data.product;
}

export type ProductFirstVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  weight: number;
  weightUnit: "GRAMS" | "KILOGRAMS" | "OUNCES" | "POUNDS";
};

export type ProductWithFirstVariant = ProductSummary & {
  firstVariant: ProductFirstVariant | null;
};

export async function getProductsByIds(ids: string[]): Promise<ProductWithFirstVariant[]> {
  if (ids.length === 0) return [];
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Nodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          ...ProductFields
          variants(first: 1) {
            edges {
              node {
                id
                title
                availableForSale
                price { amount currencyCode }
                weight
                weightUnit
              }
            }
          }
        }
      }
    }
  `;
  type Node = ProductSummary & {
    variants: { edges: Array<{ node: ProductFirstVariant }> };
  };
  const data = await shopifyFetch<{ nodes: Array<Node | null> }>(query, { ids }, false);
  return data.nodes
    .filter((n): n is Node => n !== null)
    .map((n) => ({ ...n, firstVariant: n.variants.edges[0]?.node ?? null }));
}

export async function getCollectionProducts(handle: string, first = 24): Promise<ProductSummary[]> {
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Collection($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        products(first: $first) { edges { node { ...ProductFields } } }
      }
    }
  `;
  const data = await shopifyFetch<{
    collection: { products: { edges: Array<{ node: ProductSummary }> } } | null;
  }>(query, { handle, first });
  return data.collection?.products.edges.map((e) => e.node) ?? [];
}

// Like getCollectionProducts but also returns each product's first variant
// (id, price, weight, etc.) so callers can build CartLine items in one round-trip.
// Used by /api/skin-analyzer/products to render Add-to-Cart on result cards.
export async function getCollectionProductsWithVariant(
  handle: string,
  first = 3
): Promise<ProductWithFirstVariant[]> {
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query CollectionWithVariant($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        products(first: $first) {
          edges {
            node {
              ...ProductFields
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price { amount currencyCode }
                    weight
                    weightUnit
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  type Node = ProductSummary & {
    variants: { edges: Array<{ node: ProductFirstVariant }> };
  };
  const data = await shopifyFetch<{
    collection: { products: { edges: Array<{ node: Node }> } } | null;
  }>(query, { handle, first });
  return (data.collection?.products.edges ?? []).map((e) => ({
    ...e.node,
    firstVariant: e.node.variants.edges[0]?.node ?? null,
  }));
}

export function formatMoney(money: Money): string {
  const n = parseFloat(money.amount);
  if (money.currencyCode === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: money.currencyCode,
  }).format(n);
}

// ── Customer Auth (Storefront API) ─────────────────────────────────────
export type CustomerData = { id: string; email: string; firstName: string | null; lastName: string | null };
export type AuthResult =
  | { ok: true; accessToken: string; expiresAt: string; customer: CustomerData }
  | { ok: false; errors: Array<{ code?: string; field?: string[]; message: string }> };

export async function customerLogin(email: string, password: string): Promise<AuthResult> {
  const M = /* GraphQL */ `
    mutation Login($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: Array<{ code?: string; field?: string[]; message: string }>;
    };
  }>(M, { input: { email, password } }, false);

  const tok = data.customerAccessTokenCreate.customerAccessToken;
  const errs = data.customerAccessTokenCreate.customerUserErrors;
  if (!tok) return { ok: false, errors: errs };

  const customer = await fetchCustomer(tok.accessToken);
  if (!customer) return { ok: false, errors: [{ message: "Failed to fetch customer profile" }] };
  return { ok: true, accessToken: tok.accessToken, expiresAt: tok.expiresAt, customer };
}

export async function customerRegister(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}): Promise<AuthResult> {
  const M = /* GraphQL */ `
    mutation Register($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerCreate: {
      customer: CustomerData | null;
      customerUserErrors: Array<{ code?: string; field?: string[]; message: string }>;
    };
  }>(M, { input }, false);

  const errs = data.customerCreate.customerUserErrors;
  if (!data.customerCreate.customer) return { ok: false, errors: errs };
  return customerLogin(input.email, input.password);
}

export async function customerLogout(accessToken: string): Promise<{ ok: boolean }> {
  const M = /* GraphQL */ `
    mutation Logout($t: String!) {
      customerAccessTokenDelete(customerAccessToken: $t) {
        deletedAccessToken
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerAccessTokenDelete: {
      deletedAccessToken: string | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(M, { t: accessToken }, false);
  return { ok: !!data.customerAccessTokenDelete.deletedAccessToken };
}

// ── Customer Orders ────────────────────────────────────────────────────
export type CustomerOrder = {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  statusUrl: string | null;
  totalPrice: Money;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: { image: { url: string; altText: string | null } | null } | null;
      };
    }>;
  };
};

export async function fetchCustomerOrders(accessToken: string, first = 20): Promise<CustomerOrder[]> {
  const Q = /* GraphQL */ `
    query CustomerOrders($t: String!, $first: Int!) {
      customer(customerAccessToken: $t) {
        orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              name
              processedAt
              financialStatus
              fulfillmentStatus
              statusUrl
              totalPrice { amount currencyCode }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      image { url altText }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customer: { orders: { edges: Array<{ node: CustomerOrder }> } } | null;
  }>(Q, { t: accessToken, first }, false);
  return data.customer?.orders.edges.map((e) => e.node) ?? [];
}

// ── Customer Order Detail ──────────────────────────────────────────────
export type ShippingAddress = {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
};

export type FulfillmentTrackingInfo = { number: string | null; url: string | null };

export type SuccessfulFulfillment = {
  trackingCompany: string | null;
  trackingInfo: FulfillmentTrackingInfo[];
};

export type OrderLineItemDetail = {
  title: string;
  quantity: number;
  originalTotalPrice: Money;
  discountedTotalPrice: Money;
  variant: {
    id: string;
    title: string;
    sku: string | null;
    image: Image | null;
    price: Money;
    product: { handle: string } | null;
  } | null;
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  statusUrl: string | null;
  email: string | null;
  phone: string | null;
  currentSubtotalPrice: Money | null;
  currentTotalShippingPrice: Money | null;
  currentTotalTax: Money | null;
  currentTotalPrice: Money | null;
  totalPrice: Money;
  shippingAddress: ShippingAddress | null;
  successfulFulfillments: SuccessfulFulfillment[] | null;
  lineItems: { edges: Array<{ node: OrderLineItemDetail }> };
};

export async function fetchCustomerOrder(
  accessToken: string,
  orderNumber: number
): Promise<CustomerOrderDetail | null> {
  const Q = /* GraphQL */ `
    query CustomerOrder($t: String!, $query: String!) {
      customer(customerAccessToken: $t) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              orderNumber
              name
              processedAt
              financialStatus
              fulfillmentStatus
              statusUrl
              email
              phone
              currentSubtotalPrice { amount currencyCode }
              currentTotalShippingPrice { amount currencyCode }
              currentTotalTax { amount currencyCode }
              currentTotalPrice { amount currencyCode }
              totalPrice { amount currencyCode }
              shippingAddress {
                firstName lastName company
                address1 address2
                city province zip country phone
              }
              successfulFulfillments(first: 10) {
                trackingCompany
                trackingInfo { number url }
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalTotalPrice { amount currencyCode }
                    discountedTotalPrice { amount currencyCode }
                    variant {
                      id
                      title
                      sku
                      image { url altText width height }
                      price { amount currencyCode }
                      product { handle }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customer: { orders: { edges: Array<{ node: CustomerOrderDetail }> } } | null;
  }>(Q, { t: accessToken, query: `name:"#${orderNumber}"` }, false);
  const node = data.customer?.orders.edges[0]?.node ?? null;
  if (!node || node.orderNumber !== orderNumber) return null;
  return node;
}

export async function fetchCustomer(accessToken: string): Promise<CustomerData | null> {
  const Q = /* GraphQL */ `
    query Customer($t: String!) {
      customer(customerAccessToken: $t) {
        id email firstName lastName
      }
    }
  `;
  const data = await shopifyFetch<{ customer: CustomerData | null }>(Q, { t: accessToken }, false);
  return data.customer;
}
