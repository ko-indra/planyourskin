"use client";

export default function AnalyzingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-brand text-3xl text-white">
          🔬
        </div>
      </div>
      <h2 className="mt-6 text-[20px] font-semibold text-[#222529]">
        Menganalisis Kulit Anda…
      </h2>
      <p className="mt-2 max-w-xs text-center text-[14px] text-neutral-600">
        AI sedang memproses foto Anda. Mohon tunggu beberapa detik.
      </p>
    </div>
  );
}
