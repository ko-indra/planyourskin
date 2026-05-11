import dynamic from "next/dynamic";

// Client-only — MediaPipe + camera need browser APIs.
const SkinAnalyzerApp = dynamic(() => import("./_components/SkinAnalyzerApp"), {
  ssr: false,
  loading: () => (
    <div className="py-20 text-center text-[#777]">Memuat Skin Analyzer…</div>
  ),
});

export const metadata = {
  title: "Skin Analyzer — PlanYourSkin",
  description:
    "Analisis kondisi kulit wajahmu secara instan dengan AI dermatologi PlanYourSkin.",
};

export default function SkinAnalyzerPage() {
  // No Breadcrumb here — the standalone tool is meant to take the full viewport
  // (it has its own brand-pill header and immersive gradient background).
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400;1,9..144,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <SkinAnalyzerApp />
    </>
  );
}
