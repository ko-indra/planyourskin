import { getCollectionProducts } from "@/lib/shopify";
import ProductCard from "@/components/product/ProductCard";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  const products = await getCollectionProducts(params.handle, 48);
  if (!products.length) notFound();

  return (
    <div className="mx-auto max-w-site px-4 py-12 md:px-8">
      <h1 className="mb-8 font-display text-3xl capitalize md:text-4xl">
        {params.handle.replace(/-/g, " ")}
      </h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
