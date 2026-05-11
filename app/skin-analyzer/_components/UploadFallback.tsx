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
    <div className="mx-auto max-w-md text-center md:max-w-xl">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-3xl">
        📷
      </div>
      <h2 className="text-[22px] font-semibold text-[#222529]">
        Upload Foto Selfie
      </h2>
      {reason && (
        <p className="mt-2 text-[14px] text-neutral-600">{reason}</p>
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
        Pilih atau ambil foto wajah lurus menghadap kamera dengan pencahayaan yang cukup.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#222529] px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#3a3e44] disabled:opacity-50 md:w-auto"
      >
        {busy ? "Memproses…" : "Pilih Foto"}
      </button>

      {error && (
        <p className="mt-4 text-[13px] text-red-600">{error}</p>
      )}
    </div>
  );
}
