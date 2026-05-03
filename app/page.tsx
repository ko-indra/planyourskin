import { getProducts } from "@/lib/shopify";
import HeroCarousel from "@/components/home/HeroCarousel";
import BadgesMarquee from "@/components/home/BadgesMarquee";
import MostLovedFormula from "@/components/home/MostLovedFormula";
import CategoryCircles from "@/components/home/CategoryCircles";
import CollectionCards from "@/components/home/CollectionCards";
import AboutBlock from "@/components/home/AboutBlock";

export default async function HomePage() {
  const products = await getProducts(8);

  return (
    <>
      <HeroCarousel />
      <BadgesMarquee />
      <MostLovedFormula products={products} />
      <CategoryCircles />
      <CollectionCards />
      <AboutBlock />
    </>
  );
}
