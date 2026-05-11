"use client";
import { useEffect, useState } from "react";
import type { SkinAnalysis } from "@/lib/gemini";
import { mapConcernToHandle } from "../_lib/concern-map";
import ConcernProductSlot from "./ConcernProductSlot";

type Props = {
  analysis: SkinAnalysis;
  imageDataUrl: string | null;
  onRetake: () => void;
};

const SEVERITY_STYLES: Record<string, string> = {
  tinggi: "bg-red-50 text-red-700 ring-1 ring-red-200",
  sedang: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  rendah: "bg-green-50 text-green-700 ring-1 ring-green-200",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ResultModal({ analysis, imageDataUrl, onRetake }: Props) {
  const score = Math.max(0, Math.min(100, Math.round(analysis.overallScore ?? 0)));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - displayScore / 100);

  return (
    <div className="mx-auto max-w-md md:max-w-2xl">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-stretch md:gap-8">
          {/* Score ring */}
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E491A9" />
                  <stop offset="100%" stopColor="#BB5352" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={RADIUS} stroke="#F1F1F3" strokeWidth="8" fill="none" />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 60ms linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[32px] font-semibold text-[#222529]">{displayScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Skor</span>
            </div>
          </div>

          {/* Selfie thumb + summary */}
          <div className="min-w-0 flex-1 space-y-3">
            {imageDataUrl && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Hasil analisis"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand-soft"
                />
                <div className="flex flex-wrap gap-2">
                  <Badge label="Tipe Kulit" value={analysis.skinType} />
                  <Badge label="Hidrasi" value={analysis.hydrationLevel} />
                </div>
              </div>
            )}
            {!imageDataUrl && (
              <div className="flex flex-wrap gap-2">
                <Badge label="Tipe Kulit" value={analysis.skinType} />
                <Badge label="Hidrasi" value={analysis.hydrationLevel} />
              </div>
            )}
            <p className="text-[14px] leading-relaxed text-neutral-700">
              {analysis.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Concerns */}
      {analysis.concerns?.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[16px] font-semibold text-[#222529]">
            Hal yang perlu perhatian
          </h2>
          <ul className="space-y-4">
            {analysis.concerns.map((c, i) => {
              const handle = mapConcernToHandle(c.name);
              const sevKey = (c.severity ?? "").toLowerCase();
              return (
                <li
                  key={i}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{c.icon || "⚠️"}</span>
                      <div>
                        <p className="text-[15px] font-semibold text-[#222529]">{c.name}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">
                          {c.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        SEVERITY_STYLES[sevKey] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  {handle && <ConcernProductSlot handle={handle} limit={3} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Strengths */}
      {analysis.strengths?.length > 0 && (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 text-[15px] font-semibold text-[#222529]">Kelebihan Kulitmu</h2>
          <ul className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
                <span>✅</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 text-[15px] font-semibold text-[#222529]">Saran Perawatan</h2>
          <ul className="space-y-1.5">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
                <span>💡</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex w-full items-center justify-center rounded-full border border-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] hover:bg-[#222529] hover:text-white md:w-auto"
        >
          Analisis Ulang
        </button>
        <p className="text-center text-[11px] leading-relaxed text-neutral-500">
          Hasil ini bersifat indikatif dan bukan diagnosa medis.
        </p>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px]">
      <span className="text-neutral-500">{label}:</span>
      <span className="font-semibold text-brand-dark">{value || "-"}</span>
    </span>
  );
}
