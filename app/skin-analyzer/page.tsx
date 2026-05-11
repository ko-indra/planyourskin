import dynamic from "next/dynamic";
import Breadcrumb from "@/components/layout/Breadcrumb";

// MediaPipe + camera access require browser APIs — must be client-only.
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
  return (
    <>
      <Breadcrumb items={[{ label: "Skin Analyzer" }]} />
      <section className="mx-auto max-w-site px-4 py-10 md:px-[21px] md:py-16">
        <SkinAnalyzerApp />
      </section>
    </>
  );
}
