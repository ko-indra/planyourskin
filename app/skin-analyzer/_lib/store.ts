"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SkinAnalysis } from "@/lib/gemini";

type SkinAnalyzerState = {
  result: SkinAnalysis | null;
  capturedAt: string | null; // ISO timestamp
  setResult: (result: SkinAnalysis) => void;
  clear: () => void;
};

export const useSkinAnalyzer = create<SkinAnalyzerState>()(
  persist(
    (set) => ({
      result: null,
      capturedAt: null,
      setResult: (result) => set({ result, capturedAt: new Date().toISOString() }),
      clear: () => set({ result: null, capturedAt: null }),
    }),
    {
      name: "pys-skin-analyzer",
      storage: createJSONStorage(() => localStorage),
      // Do NOT persist image dataUrl — too large for localStorage.
      partialize: (s) => ({ result: s.result, capturedAt: s.capturedAt }),
    }
  )
);
