"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="text-[#222529] nav:hidden"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 nav:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-[70] w-[300px] max-w-[85vw] overflow-y-auto bg-white shadow-xl nav:hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <span className="text-sm font-medium uppercase tracking-wider text-[#222529]">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-[#222529]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <ul className="divide-y divide-neutral-100">
              {items.map((item) => {
                const isExpanded = expanded === item.label;
                return (
                  <li key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : item.label)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left text-[13px] font-medium tracking-wide text-[#222529] hover:text-brand"
                        >
                          {item.label}
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <ul className="bg-neutral-50 pb-2">
                            {item.children.map((c) => (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  onClick={() => setOpen(false)}
                                  className="block px-8 py-2 text-[13px] text-[#222529] hover:text-brand"
                                >
                                  {c.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block px-5 py-4 text-[13px] font-medium tracking-wide text-[#222529] hover:text-brand"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </>
  );
}
