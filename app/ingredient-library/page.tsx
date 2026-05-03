import fs from "node:fs/promises";
import path from "node:path";
import Breadcrumb from "@/components/layout/Breadcrumb";
import IngredientList from "./IngredientList";

export const metadata = { title: "Ingredient Library | PlanYourSkin" };

type Ingredient = { name: string; why: string; source: string; what: string };
type Data = { title: string; items: Ingredient[] };

async function loadData(): Promise<Data> {
  const file = path.join(process.cwd(), "content", "pages", "ingredient-library.json");
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

export default async function IngredientLibraryPage() {
  const { items } = await loadData();

  return (
    <>
      <Breadcrumb items={[{ label: "Ingredient Library" }]} />

      {/* Hero with YouTube video bg + overlay card (matches planyourskin.com) */}
      <section className="mx-auto max-w-site px-4 md:px-[21px]">
        <div
          className="relative aspect-[1400/600] w-full overflow-hidden"
          style={{ backgroundImage: "url(/assets/ingredient-library/hero.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* Cover-style YouTube embed: scaled to cover hero area, no letterbox */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/qC0zqH5UfSY?autoplay=1&mute=1&loop=1&playlist=qC0zqH5UfSY&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&disablekb=1"
              title="Ingredient Library"
              allow="autoplay; encrypted-media"
              className="absolute left-1/2 top-1/2 h-[max(56.25vw,177.77%)] w-[max(177.77%,177.77vw)] -translate-x-1/2 -translate-y-1/2 border-0"
              style={{ aspectRatio: "16 / 9" }}
            />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="ml-6 max-w-md bg-white/90 p-6 md:ml-12 md:p-8">
              <h1 className="text-[24px] font-semibold leading-[1.2] text-[#222529] md:text-[28px]">
                The Ingredient Library
              </h1>
              <p className="mt-3 text-[14px] leading-[20px] text-[#555]">
                Learn everything you need to know about our ingredients.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-site px-4 py-12 md:px-[21px] md:py-16">
        <h2 className="mb-8 text-center text-[28px] font-semibold leading-[1.2] text-[#222529] md:text-[32px]">
          Search Ingredients A-Z
        </h2>
        <IngredientList items={items} />
      </section>
    </>
  );
}
