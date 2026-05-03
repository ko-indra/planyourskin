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

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (ids.length === 0) return [];
  const query = /* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Nodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product { ...ProductFields }
      }
    }
  `;
  const data = await shopifyFetch<{ nodes: Array<ProductSummary | null> }>(query, { ids }, false);
  return data.nodes.filter((n): n is ProductSummary => n !== null);
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
