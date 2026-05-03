"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";

export default function AccountIconButton({ className = "" }: { className?: string }) {
  const open = useAccount((s) => s.open);
  const isLoggedIn = useAccount((s) => s.isLoggedIn());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      aria-label="Account"
      onClick={() => {
        if (mounted && isLoggedIn) {
          window.location.href = "/my-account";
        } else {
          open("login");
        }
      }}
      className={`hover:text-brand ${className}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={mounted && isLoggedIn ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    </button>
  );
}
