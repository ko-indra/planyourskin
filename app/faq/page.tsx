import fs from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import FaqAccordion from "./FaqAccordion";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata = { title: "FAQ | PlanYourSkin" };

type FaqItem = { q: string; a: string };
type FaqData = { title: string; categories: Record<string, FaqItem[]> };

async function loadFaq(): Promise<FaqData> {
  const file = path.join(process.cwd(), "content", "pages", "faq.json");
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

export default async function FaqPage() {
  const data = await loadFaq();
  const cats = Object.entries(data.categories);

  return (
    <>
      <Breadcrumb items={[{ label: "FAQ" }]} />

      {/* Hero section */}
      <section className="mx-auto max-w-site px-4 py-12 md:px-[21px] md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="block h-px w-10 bg-[#222529]" />
              <span className="text-[14px] font-medium tracking-[0.1em] text-[#222529]">FAQ</span>
            </div>
            <h1 className="mb-5 text-[32px] font-bold leading-[1.2] text-[#222529] md:text-[36px]">
              Frequently Asked Questions
            </h1>
            <p className="text-[14px] leading-[24px] text-[#777]">
              Selamat datang di halaman FAQ Plan Your Skin! Kami telah merangkum beberapa pertanyaan yang paling sering diajukan untuk membantu Anda. Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami.
            </p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-full">
            <Image
              src="/assets/faq/hero.webp"
              alt="Plan Your Skin FAQ"
              fill
              sizes="(max-width: 768px) 90vw, 440px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Two-column FAQ accordion */}
      <section className="mx-auto max-w-site px-4 pb-16 md:px-[21px] md:pb-20">
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
          {cats.map(([catName, items]) => (
            <div key={catName}>
              <h2
                className="mb-6 text-[28px] italic leading-[1.2] text-[#222529] md:text-[30px]"
                style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}
              >
                {catName}
              </h2>
              <FaqAccordion items={items} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
