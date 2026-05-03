import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata = { title: "About Us | PlanYourSkin" };

export default function AboutUsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "About Us" }]} />

      {/* Section 1: text left (with right padding 40px), image right */}
      <section className="mx-auto max-w-site px-4 md:px-[21px]">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-0">
          <div className="md:py-[100px] md:pr-10">
            <h2 className="mb-6 text-[32px] font-semibold leading-[1.2] text-[#222529] md:text-[33px]">
              About Plan Your Skin
            </h2>
            <div className="space-y-5 text-justify text-[15px] leading-[25px] text-[#777]">
              <p>Plan Your Skin lahir dari keyakinan bahwa merawat kulit secara efektif tidak perlu rumit.</p>
              <p>Di tengah tren 10-step routine yang terus berubah, kami kembali ke esensi skincare yang aman, efektif, dan relevan untuk kebutuhan nyata kulit.</p>
              <p>Kami hadir sebagai bestie terpercaya dalam perjalanan perawatan kulitmu membantu memahami bahan aktif, menyederhanakan langkah skincare, dan memilih produk yang benar-benar dibutuhkan, bukan sekadar mengikuti hype.</p>
              <p>Setiap produk kami dikembangkan berbasis sains, menggunakan bahan aktif dengan kadar yang efektif dan tetap nyaman untuk kulit sensitif.</p>
              <p>Dirancang khusus untuk kondisi iklim tropis yang lembap dan panas, agar kulit tetap stabil dalam aktivitas sehari-hari.</p>
              <p>Karena bagi kami, skincare bukan tentang semakin banyak, melainkan tentang semakin tepat.</p>
            </div>
          </div>
          <div className="relative aspect-square w-full overflow-hidden">
            <Image src="/assets/about-us/section-1.webp" alt="About Plan Your Skin" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
          </div>
        </div>
      </section>

      {/* Section 2: image left, text right (with left padding 40px) */}
      <section className="mx-auto max-w-site px-4 md:px-[21px]">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-0">
          <div className="relative aspect-square w-full overflow-hidden md:order-1">
            <Image src="/assets/about-us/section-2.webp" alt="Formula Plan Your Skin" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="md:order-2 md:py-[100px] md:pl-10">
            <h2 className="mb-6 text-[32px] font-semibold leading-[1.2] text-[#222529] md:text-[33px]">
              Formula
            </h2>
            <p className="mb-5 text-justify text-[15px] leading-[25px] text-[#777]">
              Di Plan Your Skin, formulasi adalah inti dari segalanya. Kami tidak hanya mengikuti tren, tetapi mengutamakan pendekatan berbasis bukti ilmiah (evidence based) dan mengedepankan kesehatan kulit (skin first approach), tanpa mengorbankan efikasi.
            </p>
            <ul className="mb-5 space-y-3 text-justify text-[15px] leading-[25px] text-[#777]">
              <li>
                <strong className="text-[#222529]">Bahan Aktif Pilihan: </strong>
                Kami menggunakan bahan aktif yang telah teruji efektivitas dan keamanannya, seperti HPR (Hydroxypinacolone Retinoate), kombinasi peptide, Ceramide NP, dan Niacinamide dalam konsentrasi yang optimal.
              </li>
              <li>
                <strong className="text-[#222529]">Fokus pada Hidrasi: </strong>
                Setiap produk diformulasikan untuk memberikan hidrasi optimal, membantu menjaga keseimbangan kulit, dan mendukung skin barrier agar tetap sehat terutama untuk kulit sensitif.
              </li>
              <li>
                <strong className="text-[#222529]">Diformulasikan dengan Penuh Perhatian: </strong>
                Seluruh produk kami terdaftar di BPOM, bersertifikasi Halal, dan dibuat dengan komitmen cruelty-free.
              </li>
            </ul>
            <p className="text-justify text-[15px] leading-[25px] text-[#777]">
              Kami percaya bahwa formula yang kami kembangkan tidak hanya efektif, tetapi juga aman dan nyaman digunakan setiap hari.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: text left (right padding), image right */}
      <section className="mx-auto max-w-site px-4 md:px-[21px]">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-0">
          <div className="md:py-[100px] md:pr-10">
            <h2 className="mb-6 text-[32px] font-semibold leading-[1.2] text-[#222529] md:text-[33px]">
              Rahasia di Balik <span className="whitespace-nowrap">#IntinyaAjaCukup</span>
            </h2>
            <p className="mb-5 text-justify text-[15px] leading-[25px] text-[#777]">
              <strong className="text-[#222529]">#IntinyaAjaCukup</strong> adalah DNA dari Plan Your Skin. Kami percaya, rutinitas yang paling mudah untuk dijalani secara konsisten dan memberikan hasil terbaik adalah yang fokus pada pilar fundamental. Rangkaian produk Plan Your Skin secara lengkap menjawab kebutuhan inti tersebut:
            </p>
            <ul className="list-disc space-y-4 pl-8 text-justify text-[15px] leading-[25px] text-[#777] marker:text-[#777]">
              <li>
                <strong className="text-[#222529]">CLEANSE (Membersihkan):</strong>
                <br />
                Fondasi paling dasar dari kulit yang sehat. Untuk memastikan kebersihan yang maksimal, <strong className="text-[#222529]">Cleansing Me Gently Cleansing Serum</strong> hadir sebagai langkah awal (<em>First Cleanser</em>) dalam metode <em>Double Cleansing</em>. Formulanya ampuh meluruhkan <em>waterproof makeup</em>, <em>sunscreen</em>, dan polusi sebelum kamu mencuci wajah dengan sabun, memastikan pori-pori bersih tuntas tanpa merusak <em>barrier</em>.
              </li>
              <li>
                <strong className="text-[#222529]">MOISTURIZE (Melembapkan):</strong>
                <br />
                Kunci untuk menjaga hidrasi dan kesehatan <em>skin barrier</em>. <strong className="text-[#222529]">TWIN Moisturizer</strong> kami (Water Cream untuk pagi & Gel Moist untuk malam) memberikan kelembapan yang pas untuk setiap kebutuhan dan kondisi kulit.
              </li>
              <li>
                <strong className="text-[#222529]">PROTECT (Melindungi):</strong>
                <br />
                Langkah non-negosiasi di pagi hari. <strong className="text-[#222529]">UV Protector Hybrid Sun Cream</strong> memberikan perlindungan spektrum luas dari UVA, UVB, dan <em>blue light</em> dengan tekstur yang sangat nyaman, ringan, dan tanpa <em>whitecast</em>.
              </li>
              <li>
                <strong className="text-[#222529]">REPAIR (Memperbaiki):</strong>
                <br />
                Momen untuk peremajaan kulit di malam hari. <strong className="text-[#222529]">All Night HPR Retinoate Repair Serum</strong> bekerja aktif membantu menyamarkan tanda-tanda penuaan dan memperbaiki tekstur kulit dengan lembut namun efektif.
              </li>
            </ul>
          </div>
          <div className="relative aspect-square w-full overflow-hidden">
            <Image src="/assets/about-us/section-3.webp" alt="#IntinyaAjaCukup" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
          </div>
        </div>
      </section>

      {/* Explore Ingredients button - centered, full width row */}
      <section className="mx-auto max-w-site px-4 pb-[100px] pt-6 text-center md:px-[21px]">
        <Link
          href="/ingredient-library"
          className="inline-block rounded-full bg-[#222529] px-[44px] py-[17px] text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
        >
          Explore Ingredients
        </Link>
      </section>
    </>
  );
}
