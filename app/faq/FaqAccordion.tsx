"use client";
import { useState } from "react";

type Item = { q: string; a: string };

export default function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between gap-4 rounded-full px-6 py-3.5 text-left text-[14px] font-bold transition-colors ${
                isOpen
                  ? "bg-[#E491A9] text-white"
                  : "border border-neutral-200 bg-white text-[#222529] hover:border-[#E491A9]"
              }`}
            >
              <span>{it.q}</span>
              <span className="shrink-0 text-[20px] font-light leading-none">
                {isOpen ? "×" : "+"}
              </span>
            </button>
            {isOpen && (
              <div
                className="prose prose-sm max-w-none px-6 pb-1 pt-4 text-[14px] leading-[24px] text-[#777]
                  prose-p:my-2 prose-p:text-[#777]
                  prose-li:my-1 prose-li:text-[#777]
                  prose-strong:text-[#222529]"
                dangerouslySetInnerHTML={{ __html: it.a }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
