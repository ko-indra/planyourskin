import ProductCardLoved from "@/components/product/ProductCardLoved";
import { type ProductSummary } from "@/lib/shopify";

export default function MostLovedFormula({ products }: { products: ProductSummary[] }) {
  return (
    <section className="mx-auto max-w-site px-4 py-8 md:px-8 md:py-10">
      <div className="text-center">
        <h2 className="text-3xl font-medium text-[#222529] md:text-4xl">Our Most Loved Formula</h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] text-[#777]">
          Only the best seller products added recently in our catalog
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCardLoved key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
