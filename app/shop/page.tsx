import { getProducts } from "@/lib/shopify";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopGrid from "./ShopGrid";

export const metadata = { title: "Shop | PlanYourSkin" };

export default async function ShopPage() {
  const products = await getProducts(48);
  return (
    <>
      <Breadcrumb items={[{ label: "Shop" }]} />
      <section className="mx-auto max-w-site px-4 py-8 md:px-[21px] md:py-12">
        <ShopGrid products={products} />
      </section>
    </>
  );
}
