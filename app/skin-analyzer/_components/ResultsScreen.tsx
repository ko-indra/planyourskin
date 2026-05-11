"use client";
import { useEffect, useRef, useState } from "react";
import type { SkinAnalysis } from "@/lib/gemini";
import type { ProductSuggestion } from "@/lib/product-suggester";
import { PRODUCT_HANDLES } from "../_lib/product-registry";

type Props = {
  analysis: SkinAnalysis;
  imageDataUrl: string | null;
  onRetake: () => void;
};

const METRIC_SCHEMA: Array<{
  key: keyof SkinAnalysis;
  descKey: keyof SkinAnalysis;
  en: string;
  id: string;
  primary: boolean;
}> = [
  { key: "moisture",  descKey: "moistureDesc",  en: "Moisture",   id: "Kelembapan",  primary: true  },
  { key: "blemish",   descKey: "blemishDesc",   en: "Acne",       id: "Beruntusan",  primary: true  },
  { key: "pie",       descKey: "pieDesc",       en: "PIE",        id: "Kemerahan",   primary: false },
  { key: "pih",       descKey: "pihDesc",       en: "PIH",        id: "Pigmentasi",  primary: false },
  { key: "fineLines", descKey: "fineLinesDesc", en: "Fine Lines", id: "Garis Halus", primary: true  },
];

const PRODUCT_IMAGES: Record<string, string> = {
  "gel-moisturizer": "/skin-analyzer/assets/products/gel-moisturizer.webp",
  "water-cream": "/skin-analyzer/assets/products/water-cream.webp",
  "hpr-serum": "/skin-analyzer/assets/products/hpr-serum.webp",
  "spf-sun-cream": "/skin-analyzer/assets/products/spf-sun-cream.webp",
  "cleansing-serum": "/skin-analyzer/assets/products/cleansing-serum.webp",
};

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function defaultMetricDesc(en: string, value: number): string {
  const v = clampPct(value);
  const ranges: Record<string, { good: string; mid: string; bad: string }> = {
    Moisture: {
      good: "Kulit Anda terhidrasi dengan baik. Pertahankan rutinitas kelembapan harian.",
      mid: "Kelembapan kulit cukup, tapi masih bisa ditingkatkan dengan moisturizer rutin.",
      bad: "Kulit cenderung kering. Tambahkan hydrating serum dan moisturizer yang lebih kaya.",
    },
    Acne: {
      good: "Kulit relatif bersih dari beruntusan dan jerawat aktif.",
      mid: "Terdapat beberapa beruntusan ringan. Jaga kebersihan dan hindari over-eksfoliasi.",
      bad: "Beruntusan/jerawat cukup signifikan. Pertimbangkan produk dengan salicylic acid atau niacinamide.",
    },
    PIE: {
      good: "Tidak ada tanda kemerahan pasca jerawat yang berarti.",
      mid: "Sedikit kemerahan terlihat. Centella asiatica dan SPF dapat membantu memudarkannya.",
      bad: "Kemerahan pasca jerawat cukup tampak. Gunakan produk anti-inflamasi dan tabir surya rutin.",
    },
    PIH: {
      good: "Pigmentasi/bekas hitam minim. Wajah tampak merata.",
      mid: "Ada bekas hitam ringan. Vitamin C dan tabir surya dapat membantu pemudaran.",
      bad: "Hiperpigmentasi cukup terlihat. Pertimbangkan tranexamic acid, alpha arbutin, atau niacinamide.",
    },
    "Fine Lines": {
      good: "Kulit halus, garis halus minimal. Kondisi sangat baik.",
      mid: "Mulai muncul garis halus tipis. Mulai gunakan retinol dosis rendah dan moisturizer kaya peptida.",
      bad: "Garis halus cukup tampak. Pertimbangkan retinol/peptida dan SPF tinggi setiap hari.",
    },
  };
  const r = ranges[en] || { good: "", mid: "", bad: "" };
  if (v >= 70) return r.good;
  if (v >= 40) return r.mid;
  return r.bad;
}

function splitSummary(text: string): string[] {
  const s = (text || "").trim();
  if (!s) return ["Analisis kulit selesai."];
  if (s.includes("\n\n")) return s.split(/\n\n+/).map((x) => x.trim()).filter(Boolean);
  const sentences = s.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) out.push(sentences.slice(i, i + 2).join(" "));
  return out;
}

export default function ResultsScreen({ analysis, imageDataUrl, onRetake }: Props) {
  const score = clampPct(analysis.overallScore);
  const [healthScore, setHealthScore] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [products, setProducts] = useState<ProductSuggestion[] | "loading" | "error">("loading");
  const detailRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const metricsListRef = useRef<HTMLDivElement>(null);

  // Animate health number + ring fills on mount
  useEffect(() => {
    let cancelled = false;
    const tHandle = setTimeout(() => {
      if (cancelled) return;

      // Animate primary rings stroke-dashoffset
      const circles = ringsRef.current?.querySelectorAll<SVGCircleElement>(".ring-fg-circle");
      const circumference = 2 * Math.PI * 36;
      circles?.forEach((c) => {
        const target = parseFloat(c.dataset.target ?? "0") || 0;
        c.style.strokeDasharray = String(circumference);
        c.style.strokeDashoffset = String(circumference * (1 - target / 100));
      });

      // Animate metric bars by adding .in class
      const rows = metricsListRef.current?.querySelectorAll<HTMLDivElement>(".metric-row");
      rows?.forEach((row, i) => {
        setTimeout(() => row.classList.add("in"), 200 + i * 100);
      });

      // Count up health score
      let cur = 0;
      const step = Math.max(1, Math.floor(score / 40));
      const counter = setInterval(() => {
        cur += step;
        if (cur >= score) {
          cur = score;
          clearInterval(counter);
        }
        setHealthScore(cur);
      }, 30);
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(tHandle);
    };
  }, [score]);

  // Fetch product suggestions
  useEffect(() => {
    let cancelled = false;
    setProducts("loading");
    fetch("/api/skin-analyzer/suggest-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis }),
    })
      .then(async (r) => {
        const d = (await r.json()) as { ok?: boolean; suggestions?: ProductSuggestion[]; error?: string };
        if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);
        return d.suggestions ?? [];
      })
      .then((s) => {
        if (!cancelled) setProducts(s);
      })
      .catch(() => {
        if (!cancelled) setProducts("error");
      });
    return () => {
      cancelled = true;
    };
  }, [analysis]);

  const toggleDetail = () => {
    const next = !detailOpen;
    setDetailOpen(next);
    if (next) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  };

  const primary = METRIC_SCHEMA.filter((m) => m.primary);
  const summaryParas = splitSummary(analysis.summary);

  return (
    <section className="screen results-screen">
      <header className="brand-pill">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/skin-analyzer/assets/logo-plan-your-skin.png"
          alt="Plan Your Skin"
          className="brand-logo-img"
        />
      </header>
      <div className="scan-label">Skin Analyzed</div>

      {/* Photo + floating icons */}
      <div className="result-photo-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageDataUrl ?? ""} alt="Hasil analisis" />
        <div className="floating-icons floating-icons-result">
          <div className="float-icon float-sun" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          </div>
          <div className="float-icon float-drop" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5C8.5 7 6 10.5 6 14a6 6 0 0012 0c0-3.5-2.5-7-6-11.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Primary rings panel */}
      <div className="rings-panel" ref={ringsRef}>
        {primary.map((m) => {
          const value = clampPct(analysis[m.key] as number);
          return (
            <div key={m.key} className="metric-ring">
              <span className="ring-label-top">{m.en}</span>
              <div className="ring-svg-wrap">
                <svg viewBox="0 0 80 80">
                  <circle className="ring-bg-circle" cx="40" cy="40" r="36" />
                  <circle
                    className="ring-fg-circle"
                    cx="40"
                    cy="40"
                    r="36"
                    data-target={value}
                  />
                </svg>
                <span className="ring-value">{value}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleDetail}
        className={`more-btn${detailOpen ? " opened" : ""}`}
      >
        <span>{detailOpen ? "Less" : "More"}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expandable detail */}
      <div
        ref={detailRef}
        className={`results-detail${detailOpen ? " open" : ""}`}
      >
        <div className="detail-divider" />

        <div className="results-header-row">
          <div className="profile-mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl ?? ""} alt="Profil" />
          </div>
          <div className="health-pill">
            <span className="health-num">
              <span>{healthScore}</span>
              <span className="health-pct">%</span>
            </span>
            <span className="health-label">Skin Health</span>
          </div>
        </div>

        <h1 className="hello-title">
          Hello,
          <br />
          <em>Beautiful</em>
        </h1>

        <div className="summary-card glass-card">
          <div>
            {summaryParas.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div className="metrics-card glass-card">
          <div className="metrics-card-header">
            <h3 className="metrics-title">
              <em>Detail</em> Skor Kulit
            </h3>
            <p className="metrics-sub">Skor 0–100 untuk setiap parameter</p>
          </div>
          <div className="metrics-list" ref={metricsListRef}>
            {METRIC_SCHEMA.map((m) => {
              const value = clampPct(analysis[m.key] as number);
              const tone = value >= 70 ? "Bagus" : value >= 40 ? "Sedang" : "Perlu perhatian";
              const desc =
                (analysis[m.descKey] as string | undefined)?.trim() ||
                defaultMetricDesc(m.en, value);
              return (
                <div
                  key={m.key}
                  className="metric-row"
                  style={{ ["--p" as string]: (value / 100).toFixed(3) } as React.CSSProperties}
                >
                  <div className="metric-row-head">
                    <div className="metric-row-name">
                      <span className="metric-row-name-en">{m.en}</span>
                      <span className="metric-row-name-id">{m.id}</span>
                    </div>
                    <span className="metric-row-value">{value}%</span>
                  </div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" />
                  </div>
                  <p className="metric-row-desc" data-tone={tone}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {analysis.concerns && analysis.concerns.length > 0 && (
          <div className="concerns-card glass-card">
            <h3 className="metrics-title">
              <em>Masalah</em> Terdeteksi
            </h3>
            <div className="concerns-grid">
              {analysis.concerns.map((c, i) => {
                const sev = (c.severity || "").toLowerCase();
                const tag =
                  sev.includes("tinggi") || sev === "high"
                    ? "high"
                    : sev.includes("sedang") || sev === "med" || sev === "medium"
                    ? "med"
                    : "low";
                return (
                  <div key={i} className="concern">
                    <div className="concern-icon">{c.icon || "⚠️"}</div>
                    <div className="concern-body">
                      <div className="concern-name">
                        <span>{c.name}</span>
                        <span className={`concern-tag ${tag}`}>{c.severity}</span>
                      </div>
                      <p className="concern-desc">{c.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="recos-card glass-card">
          <h3 className="metrics-title">
            <em>Rekomendasi</em> Perawatan
          </h3>
          <ul className="recos-list">
            {(analysis.recommendations ?? []).map((r, i) => (
              <li key={i} className="reco-item">
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="products-card glass-card">
          <div className="products-header">
            <h3 className="metrics-title">
              <em>Meet</em> Your Routine
            </h3>
            <p className="products-sub">
              Produk Plan Your Skin yang cocok untuk kondisi kulit Anda
            </p>
          </div>

          {products === "loading" && (
            <div className="products-loading" style={{ display: "flex" }}>
              <div className="products-loading-orb" />
              <span>Mencari produk yang cocok untuk Anda...</span>
            </div>
          )}

          {products === "error" && (
            <div className="products-list">
              <p className="products-empty">
                Tidak dapat memuat rekomendasi produk saat ini.
              </p>
            </div>
          )}

          {Array.isArray(products) && (
            <div className="products-list">
              {products.length === 0 ? (
                <p className="products-empty">
                  Tidak ada rekomendasi produk untuk kondisi kulit Anda saat ini.
                </p>
              ) : (
                products.map((s, i) => {
                  const img = PRODUCT_IMAGES[s.productId];
                  const handle = PRODUCT_HANDLES[s.productId];
                  const url = handle ? `/product/${handle}` : "/shop";
                  const matchPct = clampPct(s.matchPercent);
                  return (
                    <div
                      key={`${s.productId}-${i}`}
                      className="product-card"
                      style={{ animationDelay: `${i * 120}ms` }}
                    >
                      <div className="product-card-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={s.name} loading="lazy" />
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-tagline">
                          <span>{s.primaryBenefit || s.tagline || "Recommended"}</span>
                          {matchPct ? (
                            <span className="product-card-match">{matchPct}% match</span>
                          ) : null}
                        </div>
                        <h4 className="product-card-name">{s.name}</h4>
                        <p className="product-card-reason">{s.reason}</p>
                        <a
                          className="product-card-cta"
                          href={url}
                        >
                          <span>Lihat Produk</span>
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                            <path d="M7 17L17 7M9 7h8v8" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRetake}
          className="btn-primary btn-retry-new"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </svg>
          <span>Analisis Ulang</span>
        </button>

        <p className="results-footer">Plan Your Skin · AI Dermatology</p>
      </div>
    </section>
  );
}
