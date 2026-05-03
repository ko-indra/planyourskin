"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-store";

export default function MyAccountDashboard() {
  const { customer, accessToken, clearAuth, open, isLoggedIn } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="text-center text-[#777]">Loading…</div>;

  if (!isLoggedIn() || !customer) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-[32px] font-semibold text-[#222529]">My Account</h1>
        <p className="mb-6 text-[15px] text-[#777]">Kamu belum login. Login dulu untuk melihat dashboard.</p>
        <button
          onClick={() => open("login")}
          className="rounded-full bg-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white hover:opacity-90"
        >
          Login
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    if (accessToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      }).catch(() => {});
    }
    clearAuth();
  };

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-[32px] font-semibold text-[#222529]">Hi, {fullName}</h1>
      <p className="mb-8 text-[15px] text-[#777]">{customer.email}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-6">
          <h2 className="mb-2 text-[16px] font-semibold text-[#222529]">Order History</h2>
          <p className="text-[13px] text-[#777]">Lihat dan track pesanan kamu.</p>
          <p className="mt-3 text-[12px] italic text-[#aaa]">Coming soon</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-6">
          <h2 className="mb-2 text-[16px] font-semibold text-[#222529]">Address Book</h2>
          <p className="text-[13px] text-[#777]">Kelola alamat pengiriman.</p>
          <p className="mt-3 text-[12px] italic text-[#aaa]">Coming soon</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 rounded-full border border-[#222529] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] hover:bg-[#222529] hover:text-white"
      >
        Logout
      </button>
    </div>
  );
}
