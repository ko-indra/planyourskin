"use client";
import { useState } from "react";
import type { SkinAnalysis } from "@/lib/gemini";
import { useSkinAnalyzer } from "../_lib/store";
import WelcomeScreen from "./WelcomeScreen";
import CameraScreen from "./CameraScreen";
import AnalyzingOverlay from "./AnalyzingOverlay";
import ResultModal from "./ResultModal";
import UploadFallback from "./UploadFallback";

type Phase = "welcome" | "camera" | "upload" | "analyzing" | "result" | "error";

export default function SkinAnalyzerApp() {
  const { result, setResult, clear } = useSkinAnalyzer();
  const [phase, setPhase] = useState<Phase>(result ? "result" : "welcome");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [cameraFailReason, setCameraFailReason] = useState<string | null>(null);

  const handleStart = () => {
    setErrorMsg(null);
    setImageDataUrl(null);
    setCameraFailReason(null);
    setPhase("camera");
  };

  const handleCameraError = (reason: string) => {
    setCameraFailReason(reason);
    setPhase("upload");
  };

  const submitImage = async (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    setPhase("analyzing");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/skin-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = (await res.json()) as { ok?: boolean; analysis?: SkinAnalysis; error?: string };
      if (!res.ok || !json.ok || !json.analysis) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setResult(json.analysis);
      setPhase("result");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    }
  };

  const handleRetake = () => {
    clear();
    setImageDataUrl(null);
    setErrorMsg(null);
    setPhase("welcome");
  };

  return (
    <>
      {phase === "welcome" && <WelcomeScreen onStart={handleStart} />}

      {phase === "camera" && (
        <CameraScreen onCapture={submitImage} onCameraError={handleCameraError} />
      )}

      {phase === "upload" && (
        <UploadFallback
          reason={cameraFailReason ?? undefined}
          onImage={submitImage}
        />
      )}

      {phase === "analyzing" && <AnalyzingOverlay />}

      {phase === "result" && result && (
        <ResultModal
          analysis={result}
          imageDataUrl={imageDataUrl}
          onRetake={handleRetake}
        />
      )}

      {phase === "error" && (
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>
          <h2 className="text-[20px] font-semibold text-[#222529]">Gagal Menganalisis</h2>
          <p className="mt-2 text-[14px] text-neutral-600">
            {errorMsg ?? "Terjadi kesalahan. Silakan coba lagi."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setPhase("welcome")}
              className="inline-flex items-center justify-center rounded-full border border-[#222529] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] hover:bg-[#222529] hover:text-white"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
