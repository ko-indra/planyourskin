import Image from "next/image";
import Link from "next/link";

export default function AboutBlock() {
  return (
    <section className="mx-auto max-w-site px-4 py-8 md:px-8 md:py-10">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[872/997] w-full overflow-hidden">
          <Image
            src="/assets/about/generic-6-1.jpg"
            alt="Skincare Shouldn't be Complicated"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="md:pl-8">
          <h2 className="text-3xl font-medium leading-tight text-[#222529] md:text-[42px] md:leading-[1.15]">
            Skincare Shouldn&apos;t be Complicated.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#777]">
            Healthy skin comes from consistency not complexity. We focus on high performance essentials that truly work. <strong className="text-[#222529]">#IntinyaAjaCukup</strong>.
          </p>
          <Link
            href="/about-us"
            className="mt-7 inline-block rounded-full border border-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] transition-colors hover:bg-[#222529] hover:text-white"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
