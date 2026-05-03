import { getProducts } from "@/lib/shopify";
import ProductCardLoved from "@/components/product/ProductCardLoved";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata = { title: "Best Seller | PlanYourSkin" };

export default async function BestSellerPage() {
  const products = await getProducts(48);
  return (
    <>
      <Breadcrumb items={[{ label: "Best Seller" }]} />
      <section className="mx-auto max-w-site px-4 py-12 md:px-[21px] md:py-16">
        <h1 className="mb-10 text-center text-[32px] font-semibold leading-[1.2] text-[#222529] md:text-[33px]">
          Best Seller
        </h1>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCardLoved key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
