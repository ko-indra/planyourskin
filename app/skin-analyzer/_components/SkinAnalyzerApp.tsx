"use client";
import { useState } from "react";
import "../skin-analyzer.css";
import type { SkinAnalysis } from "@/lib/gemini";
import { useSkinAnalyzer } from "../_lib/store";
import WelcomeScreen from "./WelcomeScreen";
import CameraScreen from "./CameraScreen";
import ResultsScreen from "./ResultsScreen";
import UploadFallback from "./UploadFallback";

type Phase = "welcome" | "camera" | "upload" | "result" | "error";

// Shared SVG defs reused by score rings across screens
function SharedDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A88AE0" />
          <stop offset="50%" stopColor="#7C5DD3" />
          <stop offset="100%" stopColor="#5A3BAB" />
        </linearGradient>
        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7A8C0" />
          <stop offset="100%" stopColor="#7C5DD3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SkinAnalyzerApp() {
  const { result, setResult, clear } = useSkinAnalyzer();
  // Always start at welcome — entering the route via the header CTA should
  // never skip past the intro just because a previous session is cached.
  // The cached `result` is still used inside the current session (so the
  // result screen can re-render after navigating away and back via in-app
  // links) but it does not auto-open on mount.
  const [phase, setPhase] = useState<Phase>("welcome");
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

  const submitImage = async (cleanDataUrl: string, displayDataUrl: string) => {
    setImageDataUrl(displayDataUrl);
    try {
      const res = await fetch("/api/skin-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: cleanDataUrl }),
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
    <div className="sa-root">
      <SharedDefs />
      <div className="app-grain" aria-hidden="true" />

      <div className="app-container">
        {phase === "welcome" && <WelcomeScreen onStart={handleStart} />}

        {phase === "camera" && (
          <CameraScreen
            onCapture={submitImage}
            onCameraError={handleCameraError}
          />
        )}

        {phase === "upload" && (
          <UploadFallback
            reason={cameraFailReason ?? undefined}
            onImage={(dataUrl) => submitImage(dataUrl, dataUrl)}
          />
        )}

        {phase === "result" && result && (
          <ResultsScreen
            analysis={result}
            imageDataUrl={imageDataUrl}
            onRetake={handleRetake}
          />
        )}

        {phase === "error" && (
          <section className="screen welcome-screen">
            <header className="brand-pill">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/skin-analyzer/assets/logo-plan-your-skin.png"
                alt="Plan Your Skin"
                className="brand-logo-img"
              />
            </header>
            <div className="welcome-hero">
              <h1 className="hero-headline">
                <em>Gagal</em> menganalisis.
              </h1>
              <p className="hero-sub">{errorMsg ?? "Terjadi kesalahan. Silakan coba lagi."}</p>
            </div>
            <button
              type="button"
              onClick={() => setPhase("welcome")}
              className="btn-primary"
            >
              <span>Coba Lagi</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
