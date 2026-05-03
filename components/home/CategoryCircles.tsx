import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { label: "Shop All", img: "/assets/categories/Website-_SHOP-All_.webp", href: "/shop" },
  { label: "Moisturizer", img: "/assets/categories/Website-MOISTURIZER.webp", href: "/product-category/moisturizer" },
  { label: "HPR Serum", img: "/assets/categories/Website-HPR-Serum.webp", href: "/product-category/serums" },
  { label: "Cleansing", img: "/assets/categories/Website-CLEANSING.webp", href: "/product-category/cleansing-serum" },
  { label: "SPF", img: "/assets/categories/Website-SPF.webp", href: "/product-category/sunscreen" },
];

export default function CategoryCircles() {
  return (
    <section className="mx-auto max-w-site px-4 py-6 md:px-8 md:py-8">
      <div className="grid grid-cols-3 gap-6 md:grid-cols-5 md:gap-8">
        {CATEGORIES.map((c) => (
          <Link key={c.label} href={c.href} className="group flex flex-col items-center text-center">
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={c.img}
                alt={c.label}
                fill
                sizes="(max-width: 768px) 30vw, 18vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <span className="mt-3 text-[14px] font-medium text-[#222529] group-hover:text-brand">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
