"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount } from "@/lib/account-store";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type LoginValues = z.infer<typeof LoginSchema>;

const RegisterSchema = z.object({
  firstName: z.string().min(1, "Nama depan wajib"),
  lastName: z.string().min(1, "Nama belakang wajib"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

export default function AccountModal() {
  const { isOpen, view, close, setView, setAuth } = useAccount();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setServerError(null);
  }, [view, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden />
      <div className="relative z-10 grid w-full max-w-[960px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        {/* Close */}
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#222529] hover:bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left image */}
        <div className="relative hidden aspect-square md:block">
          <Image
            src="/assets/account/login-bg.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover"
            priority
          />
        </div>

        {/* Right form */}
        <div className="flex flex-col justify-center bg-[#f5efe6]/40 p-8 md:p-12">
          {view === "login" ? (
            <LoginForm
              onSuccess={(data) => setAuth(data)}
              onSwitchView={() => setView("register")}
              setServerError={setServerError}
              serverError={serverError}
              submitting={submitting}
              setSubmitting={setSubmitting}
            />
          ) : (
            <RegisterForm
              onSuccess={(data) => setAuth(data)}
              onSwitchView={() => setView("login")}
              setServerError={setServerError}
              serverError={serverError}
              submitting={submitting}
              setSubmitting={setSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-full border border-transparent bg-[#ececec]/70 px-5 py-3 text-[14px] text-[#222529] placeholder:text-[#999] focus:border-brand focus:bg-white focus:outline-none";

type AuthSuccess = {
  accessToken: string;
  expiresAt: string;
  customer: { id: string; email: string; firstName: string | null; lastName: string | null };
};

type CommonProps = {
  onSuccess: (data: AuthSuccess) => void;
  onSwitchView: () => void;
  setServerError: (m: string | null) => void;
  serverError: string | null;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
};

function LoginForm({ onSuccess, onSwitchView, setServerError, serverError, submitting, setSubmitting }: CommonProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login gagal");
      onSuccess(data);
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-[26px] font-semibold leading-[1.2] text-[#222529] md:text-[28px]">
          Give your skin the best care.
        </h2>
        <p className="mt-2 text-[13px] text-[#777]">Welcome back to your account, ready to glow?</p>
      </div>

      <div>
        <input className={inputCls} placeholder="email / username" {...register("email")} />
        {errors.email && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <input className={inputCls} type="password" placeholder="password" {...register("password")} />
        {errors.password && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.password.message}</p>}
        <div className="mt-1 text-right">
          <a href="#" className="text-[12px] italic text-[#777] hover:text-brand">Forgot Password?</a>
        </div>
      </div>

      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-[13px] text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#222529] py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Signing in..." : "Sign in now"}
      </button>

      {/* TODO: re-enable Google sign-in via Shopify Customer Account API after production domain is set up
          - register Client ID + callback URL https://<domain>/api/auth/shopify-callback in Headless app
          - wire up PKCE OAuth flow + /api/auth/shopify-callback route */}

      <p className="text-center text-[13px] text-[#777]">
        don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchView} className="font-bold text-[#222529] hover:text-brand">
          register
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSuccess, onSwitchView, setServerError, serverError, submitting, setSubmitting }: CommonProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registrasi gagal");
      onSuccess(data);
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-[26px] font-semibold leading-[1.2] text-[#222529] md:text-[28px]">
          Create your account
        </h2>
        <p className="mt-2 text-[13px] text-[#777]">Join the #IntinyaAjaCukup family.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <input className={inputCls} placeholder="first name" {...register("firstName")} />
          {errors.firstName && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <input className={inputCls} placeholder="last name" {...register("lastName")} />
          {errors.lastName && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <input className={inputCls} placeholder="email" {...register("email")} />
        {errors.email && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <input className={inputCls} type="password" placeholder="password (min 6 char)" {...register("password")} />
        {errors.password && <p className="mt-1 px-3 text-[12px] text-red-600">{errors.password.message}</p>}
      </div>

      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-[13px] text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#222529] py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create account"}
      </button>

      <p className="text-center text-[13px] text-[#777]">
        already have an account?{" "}
        <button type="button" onClick={onSwitchView} className="font-bold text-[#222529] hover:text-brand">
          sign in
        </button>
      </p>
    </form>
  );
}
