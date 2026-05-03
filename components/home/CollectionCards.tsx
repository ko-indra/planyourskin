import Image from "next/image";
import Link from "next/link";

const COLLECTIONS = [
  { label: "Brightening Heroes", img: "/assets/collections/brightening-heroes.webp", href: "/product-category/brightening" },
  { label: "Value Bundles", img: "/assets/collections/value-bundles.webp", href: "/product-category/bundles" },
  { label: "The Essentials Kit", img: "/assets/collections/essentials-kit.webp", href: "/product-category/essentials" },
  { label: "Slow Aging Series", img: "/assets/collections/slow-aging.webp", href: "/product-category/slow-aging" },
];

export default function CollectionCards() {
  return (
    <section className="mx-auto max-w-site px-4 py-6 md:px-8 md:py-8">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
        {COLLECTIONS.map((c) => (
          <Link key={c.label} href={c.href} className="group block">
            <div className="relative aspect-[7/9] overflow-hidden bg-neutral-100">
              <Image
                src={c.img}
                alt={c.label}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h3 className="mt-4 text-center text-[16px] font-medium text-[#222529]">{c.label}</h3>
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.15em] text-brand group-hover:underline">
              Shop Now
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
