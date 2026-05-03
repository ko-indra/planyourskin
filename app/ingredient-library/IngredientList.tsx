"use client";
import { useMemo, useState } from "react";

type Ingredient = { name: string; why: string; source: string; what: string };

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function letterOf(name: string) {
  const c = name.replace(/^["']/, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export default function IngredientList({ items }: { items: Ingredient[] }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true })),
    [items]
  );
  const [open, setOpen] = useState<string | null>(null);

  // Group by first letter
  const byLetter = useMemo(() => {
    const m = new Map<string, Ingredient[]>();
    sorted.forEach((it) => {
      const l = letterOf(it.name);
      if (!m.has(l)) m.set(l, []);
      m.get(l)!.push(it);
    });
    return m;
  }, [sorted]);

  return (
    <>
      {/* A-Z navigation */}
      <nav className="mb-10 flex flex-wrap items-center justify-center gap-1 overflow-x-auto md:gap-2">
        {ALPHABET.concat(["#"]).map((letter) => {
          const has = byLetter.has(letter);
          return (
            <a
              key={letter}
              href={has ? `#${letter.toLowerCase()}-start` : undefined}
              aria-disabled={!has}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] transition-colors ${
                has
                  ? "text-[#222529] hover:bg-[#222529] hover:text-white"
                  : "cursor-not-allowed text-[#ccc]"
              }`}
            >
              {letter}
            </a>
          );
        })}
      </nav>

      {/* 3-column grid of accordion items */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
        {sorted.map((it, i) => {
          const isOpen = open === it.name;
          const prevLetter = i > 0 ? letterOf(sorted[i - 1].name) : "";
          const curLetter = letterOf(it.name);
          const showAnchor = prevLetter !== curLetter;
          return (
            <div key={it.name} className="contents">
              {showAnchor && (
                <span id={`${curLetter.toLowerCase()}-start`} className="sr-only" />
              )}
              <div className="break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : it.name)}
                  className={`flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-white px-5 py-4 text-left text-[14px] font-bold transition-colors ${
                    isOpen ? "text-[#E491A9]" : "text-[#222529] hover:border-[#E491A9]"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[18px] font-light leading-none">
                    {isOpen ? "−" : "+"}
                  </span>
                  <span className="flex-1">{it.name}</span>
                </button>
                {isOpen && (it.why || it.source || it.what) && (
                  <div className="space-y-2 px-5 pb-4 pt-3 text-[13px] leading-[20px] text-[#777]">
                    {it.why && (
                      <p>
                        <span className="block text-[12px] font-bold uppercase tracking-wide text-[#222529]">
                          Why we choose it
                        </span>
                        {it.why}
                      </p>
                    )}
                    {it.source && (
                      <p>
                        <span className="block text-[12px] font-bold uppercase tracking-wide text-[#222529]">
                          Source
                        </span>
                        {it.source}
                      </p>
                    )}
                    {it.what && (
                      <p>
                        <span className="block text-[12px] font-bold uppercase tracking-wide text-[#222529]">
                          What it does
                        </span>
                        {it.what}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
