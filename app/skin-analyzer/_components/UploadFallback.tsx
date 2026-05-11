"use client";
import { useRef, useState } from "react";

type Props = {
  reason?: string;
  onImage: (dataUrl: string) => void;
};

const MAX_EDGE = 1024;

async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const img = new Image();
  const fileUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = fileUrl;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}

export default function UploadFallback({ reason, onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      onImage(dataUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
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
        <div className="welcome-orb" />
        <h1 className="hero-headline">
          Upload <em>foto</em> selfie kamu.
        </h1>
        <p className="hero-sub">
          {reason ?? "Kamera tidak tersedia."} Pilih atau ambil foto wajah lurus
          menghadap kamera dengan pencahayaan cukup.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="btn-primary"
      >
        <span>{busy ? "Memproses…" : "Pilih Foto"}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>

      {error && <p className="disclaimer" style={{ color: "#E07AA0" }}>{error}</p>}
    </section>
  );
}
