"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useAdminText } from "@/context/AdminTextContext";

const errorKey: Record<string, string> = {
  pending: "admin.auth.pending",
  rejected: "admin.auth.rejected",
  "server-error": "admin.auth.serverError",
  "oauth-error": "admin.auth.oauthError",
  "missing-token": "admin.auth.missingToken",
  OAuthSignin: "admin.auth.oauthError",
  OAuthCallback: "admin.auth.oauthError",
  AccessDenied: "admin.auth.oauthError",
};

export default function AuthCard({ status }: { status?: string }) {
  const [loading, setLoading] = useState(false);
  const { t } = useAdminText();
  const messageKey = status ? errorKey[status] : undefined;
  const isPending = status === "pending";

  async function login() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
    setLoading(false);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8fbff] px-4 py-10">
      <div className="absolute -left-28 -top-28 size-80 rounded-full bg-[#10a9e8]/10 blur-3xl" />
      <div className="absolute -bottom-28 -right-28 size-80 rounded-full bg-[#ef4277]/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[2rem] border border-white bg-white/95 p-6 shadow-[0_30px_90px_rgba(6,42,84,0.15)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#062a54] text-white shadow-lg shadow-[#062a54]/20">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="text-lg font-black text-[#062a54]">Maaniko</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ef4277]">
                Admin
              </p>
            </div>
          </div>
        </div>

        <div className="mt-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#10a9e8]">
            {t("admin.auth.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#062a54]">
            {t("admin.auth.title")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {t("admin.auth.subtitle")}
          </p>
        </div>

        {messageKey && (
          <div
            className={`mt-6 flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${isPending ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            {isPending ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            ) : (
              <LockKeyhole className="mt-0.5 size-5 shrink-0" />
            )}
            <p>{t(messageKey)}</p>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={login}
          className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#062a54] px-5 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(6,42,84,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0a3b72] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4]">
              G
            </span>
          )}
          <span>
            {loading ? t("admin.auth.loading") : t("admin.auth.google")}
          </span>
          {!loading && <ArrowRight className="size-4" />}
        </button>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
          <LockKeyhole className="size-3.5 text-[#10a9e8]" />
          {t("admin.auth.secure")}
        </p>
      </section>
    </main>
  );
}
