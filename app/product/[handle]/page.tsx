import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney, getProductByHandle } from "@/lib/shopify";
import AddToCartButton from "@/components/product/AddToCartButton";
import WishlistButton from "@/components/product/WishlistButton";
import ProductGallery from "@/components/product/ProductGallery";
import Breadcrumb from "@/components/layout/Breadcrumb";

function categorySlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, "-");
}

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProductByHandle(params.handle);
  if (!product) notFound();

  const images = product.images.edges.map((e) => e.node);
  const variants = product.variants.edges.map((e) => e.node);
  const firstSku = variants.find((v) => v.sku)?.sku ?? null;

  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange.minVariantPrice;
  const priceNum = parseFloat(price.amount);
  const compareNum = parseFloat(compareAt.amount);
  const isOnSale = compareNum > priceNum && priceNum > 0;
  const salePercent = isOnSale ? Math.round(((compareNum - priceNum) / compareNum) * 100) : null;

  const categoryTags = product.tags.filter((t) => t && t.length < 40).slice().reverse();

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Shop", href: "/shop" },
          ...(categoryTags.length
            ? [{ label: categoryTags.join(", "), href: `/product-category/${categorySlug(categoryTags[0])}` }]
            : []),
          { label: product.title },
        ]}
      />

      <div className="mx-auto max-w-site px-4 py-8 md:px-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          {/* Gallery */}
          <div className="md:col-span-7">
            <ProductGallery images={images} title={product.title} salePercent={salePercent} />
          </div>

          {/* Info */}
          <div className="md:col-span-5">
            <h1 className="font-display text-3xl md:text-[34px]">{product.title}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              {isOnSale && (
                <span className="text-lg text-neutral-400 line-through">{formatMoney(compareAt)}</span>
              )}
              <span className="text-2xl font-medium text-[#222529]">{formatMoney(price)}</span>
            </div>

            <div
              className="prose prose-sm mt-6 max-w-none text-neutral-700"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />

            <div className="mt-6 space-y-1.5 border-t border-neutral-200 pt-6 text-sm text-[#222529]">
              {firstSku && (
                <p>
                  <span className="font-semibold">SKU:</span> {firstSku}
                </p>
              )}
              {categoryTags.length > 0 && (
                <p>
                  <span className="font-semibold">Categories:</span>{" "}
                  {categoryTags.map((t, i) => (
                    <span key={t}>
                      <Link
                        href={`/product-category/${categorySlug(t)}`}
                        className="text-brand hover:underline"
                      >
                        {t}
                      </Link>
                      {i < categoryTags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
              {product.vendor && (
                <p>
                  <span className="font-semibold">Brand:</span> {product.vendor}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <AddToCartButton product={product} />
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
