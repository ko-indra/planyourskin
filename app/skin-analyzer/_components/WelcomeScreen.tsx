"use client";

type Props = { onStart: () => void };

export default function WelcomeScreen({ onStart }: Props) {
  return (
    <div className="mx-auto max-w-md text-center md:max-w-xl">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-3xl">
        ✨
      </div>
      <h1 className="text-[28px] font-semibold leading-tight text-[#222529] md:text-[36px]">
        Skin Analyzer
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
        Analisis kondisi kulit wajahmu secara instan dengan teknologi AI dermatologi.
        Dapatkan skor kulit, identifikasi masalah, dan rekomendasi produk yang sesuai.
      </p>

      <ul className="mt-8 grid gap-3 text-left md:grid-cols-3">
        <Feature
          icon="📸"
          title="Foto cepat"
          desc="Selfie langsung dari kamera, otomatis terambil saat posisi pas"
        />
        <Feature
          icon="🤖"
          title="AI profesional"
          desc="Penilaian objektif berbasis machine learning dermatologi"
        />
        <Feature
          icon="🛍️"
          title="Rekomendasi produk"
          desc="Hasil analisis langsung ke produk PlanYourSkin yang relevan"
        />
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#222529] px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#3a3e44] md:w-auto"
      >
        Mulai Analisis Kulit
      </button>

      <p className="mt-6 text-[11px] leading-relaxed text-neutral-500">
        Privasi: foto kamu hanya dikirim ke server analisis dan tidak disimpan.
        Hasil dapat berbeda dari konsultasi dokter — bukan diagnosa medis.
      </p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <li className="rounded-lg border border-neutral-200 p-4">
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-[14px] font-semibold text-[#222529]">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{desc}</p>
    </li>
  );
}
