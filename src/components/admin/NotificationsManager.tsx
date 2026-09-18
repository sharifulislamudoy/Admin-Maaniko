"use client";
/* eslint-disable @next/next/no-img-element */

import { BellRing, BookmarkPlus, CheckCircle2, Loader2, RefreshCw, Send, Smartphone, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ImageUploader from "@/components/catalog/forms/ImageUploader";
import type { CloudinaryImage } from "@/types/catalog";

type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "PARTIAL" | "FAILED";
type Campaign = {
  id: string;
  type: "OFFER" | "BANNER" | "ORDER_STATUS" | "TEST";
  status: CampaignStatus;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  recipientCount: number;
  sentCount: number;
  failureCount: number;
  sentAt: string | null;
  createdAt: string;
};
type Overview = { activeDevices: number; offerDevices: number; templates?: Campaign[]; campaigns: Campaign[] };
const initialForm = { title: "", body: "", link: "/shop", imageUrl: "" };

export default function NotificationsManager() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/notifications", { cache: "no-store" });
      const body = (await response.json()) as Overview & { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Data load failed");
      setOverview(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function payload() {
    return { title: form.title.trim(), body: form.body.trim(), link: form.link.trim() || "/", imageUrl: form.imageUrl || undefined };
  }

  async function submit(mode: "send" | "save") {
    setAction(mode);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(mode === "send" ? "/api/commerce/notifications/offers" : "/api/commerce/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const result = (await response.json()) as { message?: string; sentCount?: number; failureCount?: number };
      if (!response.ok) throw new Error(result.message ?? "Notification save failed");
      setSuccess(mode === "save" ? "Notification saved হয়েছে। এখন এটি যতবার প্রয়োজন পাঠাতে পারবেন।" : `${result.sentCount ?? 0}টি device-এ notification পাঠানো হয়েছে${result.failureCount ? `, ${result.failureCount}টি failed` : ""}।`);
      setForm(initialForm);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Notification save failed");
    } finally {
      setAction(null);
    }
  }

  async function sendSaved(campaign: Campaign) {
    setAction(campaign.id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/commerce/notifications/templates/${campaign.id}/send`, { method: "POST" });
      const body = (await response.json()) as { message?: string; sentCount?: number; failureCount?: number };
      if (!response.ok) throw new Error(body.message ?? "Send failed");
      setSuccess(`${body.sentCount ?? 0}টি device-এ notification পাঠানো হয়েছে${body.failureCount ? `, ${body.failureCount}টি failed` : ""}।`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Send failed");
    } finally {
      setAction(null);
    }
  }

  async function deleteSaved(campaign: Campaign) {
    if (!window.confirm(`“${campaign.title}” saved notification delete করতে চান?`)) return;
    setAction(campaign.id);
    setError("");
    try {
      const response = await fetch(`/api/commerce/notifications/templates/${campaign.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Delete failed");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed");
    } finally {
      setAction(null);
    }
  }

  const saved = overview?.templates ?? overview?.campaigns.filter((item) => item.status === "DRAFT") ?? [];
  const sent = overview?.campaigns.filter((item) => item.status !== "DRAFT") ?? [];
  const disabled = Boolean(action) || !form.title.trim() || !form.body.trim();

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ef4277]">Customer engagement</p>
          <h1 className="mt-1 text-2xl font-black text-[#062a54] sm:text-3xl">Push notifications</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Offer এখনই পাঠান অথবা reusable notification হিসেবে save করুন। Saved notification যতবার প্রয়োজন এক click-এ পাঠানো যাবে।</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Smartphone} label="Active devices" value={overview?.activeDevices ?? 0} color="bg-sky-50 text-sky-600" />
        <StatCard icon={Users} label="Offer subscribers" value={overview?.offerDevices ?? 0} color="bg-pink-50 text-[#ef4277]" />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.78fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-pink-50 text-[#ef4277]"><BellRing className="size-5" /></span>
            <div><h2 className="text-lg font-extrabold text-[#062a54]">Create notification</h2><p className="text-xs text-slate-500">Push-এর পাশাপাশি customer inbox-এ message সংরক্ষিত থাকবে।</p></div>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Notification title" required><input required maxLength={100} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="যেমন: আজকের বিশেষ অফার" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]" /></Field>
            <Field label="Message" required><textarea required maxLength={240} rows={4} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="অফারের সংক্ষিপ্ত ও পরিষ্কার বিবরণ লিখুন" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#ef4277]" /><span className="mt-1 block text-right text-[11px] text-slate-400">{form.body.length}/240</span></Field>
            <Field label="Open link"><input value={form.link} onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))} placeholder="/shop বা https://..." className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]" /></Field>
            <Field label="Notification image (optional)"><ImageUploader images={form.imageUrl ? [{ url: form.imageUrl }] : []} onChange={(images: CloudinaryImage[]) => setForm((current) => ({ ...current, imageUrl: images[0]?.url ?? "" }))} folder="notifications" multiple={false} label="Upload notification image" help="JPG, PNG, WebP বা AVIF • সর্বোচ্চ 10MB" /></Field>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" disabled={disabled} onClick={() => void submit("send")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-extrabold text-white disabled:opacity-50">{action === "send" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send now</button>
            <button type="button" disabled={disabled} onClick={() => void submit("save")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 disabled:opacity-50">{action === "save" ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}Save for reuse</button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-[#062a54]">Saved notifications</h2>
          <p className="mt-1 text-xs text-slate-500">Send করার পরও এগুলো এখানে থাকবে এবং আবার পাঠানো যাবে।</p>
          <div className="mt-4 space-y-3">{saved.length ? saved.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} busy={action === campaign.id} saved onSend={() => void sendSaved(campaign)} onDelete={() => void deleteSaved(campaign)} />) : <Empty text="কোনো saved notification নেই।" />}</div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-[#062a54]">Recent campaigns</h2>
        {loading && !overview ? <div className="grid min-h-32 place-items-center"><Loader2 className="size-6 animate-spin text-slate-400" /></div> : <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sent.length ? sent.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} busy={false} />) : <Empty text="এখনো কোনো notification পাঠানো হয়নি।" />}</div>}
      </section>
    </div>
  );
}

function CampaignCard({ campaign, busy, saved = false, onSend, onDelete }: { campaign: Campaign; busy: boolean; saved?: boolean; onSend?: () => void; onDelete?: () => void }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">{campaign.imageUrl ? <img src={campaign.imageUrl} alt="" className="aspect-[16/7] w-full object-cover" /> : null}<div className="p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-800">{campaign.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{campaign.body}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${saved ? "bg-violet-100 text-violet-700" : statusColor(campaign.status)}`}>{saved ? "SAVED" : campaign.status}</span></div><div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2 text-[11px] text-slate-400"><span>{new Date(campaign.createdAt).toLocaleString()}</span>{saved ? <span>Reusable</span> : <span>{campaign.sentCount}/{campaign.recipientCount} sent</span>}</div>{onSend ? <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={onSend} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ef4277] px-3 text-xs font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}Send again</button><button type="button" disabled={busy} onClick={onDelete} aria-label="Saved notification delete করুন" className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 disabled:opacity-50"><Trash2 className="size-3.5" /></button></div> : null}</div></article>;
}

function statusColor(status: CampaignStatus) {
  if (status === "SENT") return "bg-emerald-100 text-emerald-700";
  if (status === "DRAFT") return "bg-amber-100 text-amber-700";
  if (status === "FAILED") return "bg-rose-100 text-rose-700";
  return "bg-sky-100 text-sky-700";
}
function Empty({ text }: { text: string }) { return <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-400">{text}</div>; }
function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) { return <p className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{tone === "success" ? <CheckCircle2 className="size-4" /> : null}{children}</p>; }
function StatCard({ icon: Icon, label, value, color }: { icon: typeof Smartphone; label: string; value: number; color: string }) { return <article className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid size-11 place-items-center rounded-2xl ${color}`}><Icon className="size-5" /></span><div><p className="text-xs font-bold text-slate-400">{label}</p><p className="text-2xl font-black text-[#062a54]">{value}</p></div></article>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-extrabold text-slate-600">{label} {required ? <span className="text-rose-500">*</span> : null}<span className="mt-1.5 block">{children}</span></label>; }
