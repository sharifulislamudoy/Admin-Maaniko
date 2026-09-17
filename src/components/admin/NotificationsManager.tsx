"use client";

import {
  BellRing,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Campaign = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  recipientCount: number;
  sentCount: number;
  failureCount: number;
  createdAt: string;
};

type Overview = {
  activeDevices: number;
  offerDevices: number;
  campaigns: Campaign[];
};

const initialForm = {
  title: "",
  body: "",
  link: "/shop",
  imageUrl: "",
};

export default function NotificationsManager() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/notifications", {
        cache: "no-store",
      });
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

  async function sendOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/commerce/notifications/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          link: form.link || "/",
          imageUrl: form.imageUrl || undefined,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        sentCount?: number;
        failureCount?: number;
      };
      if (!response.ok) throw new Error(result.message ?? "Notification send failed");
      setSuccess(
        `${result.sentCount ?? 0}টি device-এ notification পাঠানো হয়েছে${result.failureCount ? `, ${result.failureCount}টি failed` : ""}।`,
      );
      setForm(initialForm);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Notification send failed",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ef4277]">
            Customer engagement
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#062a54] sm:text-3xl">
            Push notifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Customer-এর order status alert automatic যাবে। এখান থেকে শুধু offer
            campaign পাঠান।
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          icon={Smartphone}
          label="Active devices"
          value={overview?.activeDevices ?? 0}
          color="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={Users}
          label="Offer subscribers"
          value={overview?.offerDevices ?? 0}
          color="bg-pink-50 text-[#ef4277]"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="size-4" />
          {success}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.78fr)]">
        <form
          onSubmit={(event) => void sendOffer(event)}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-pink-50 text-[#ef4277]">
              <BellRing className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#062a54]">
                Send offer alert
              </h2>
              <p className="text-xs text-slate-500">
                Browser permission দেওয়া customer-রাই এটি পাবেন।
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Notification title" required>
              <input
                required
                maxLength={100}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="যেমন: আজকের বিশেষ অফার"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
              />
            </Field>
            <Field label="Message" required>
              <textarea
                required
                maxLength={240}
                rows={4}
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                placeholder="অফারের সংক্ষিপ্ত ও পরিষ্কার বিবরণ লিখুন"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#ef4277]"
              />
              <span className="mt-1 block text-right text-[11px] text-slate-400">
                {form.body.length}/240
              </span>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Open link">
                <input
                  value={form.link}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, link: event.target.value }))
                  }
                  placeholder="/shop বা https://..."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
                />
              </Field>
              <Field label="Image URL (optional)">
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !form.title.trim() || !form.body.trim()}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-extrabold text-white transition hover:bg-[#dc356a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send notification
          </button>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-[#062a54]">
            Recent campaigns
          </h2>
          <div className="mt-4 space-y-3">
            {loading && !overview ? (
              <div className="grid min-h-40 place-items-center text-slate-400">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : overview?.campaigns.length ? (
              overview.campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-slate-800">
                        {campaign.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {campaign.body}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                      {campaign.sentCount} sent
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2 text-[11px] text-slate-400">
                    <span>{new Date(campaign.createdAt).toLocaleString()}</span>
                    <span>{campaign.recipientCount} recipients</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-400">
                এখনো কোনো offer notification পাঠানো হয়নি।
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Smartphone;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid size-11 place-items-center rounded-2xl ${color}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="text-2xl font-black text-[#062a54]">{value}</p>
      </div>
    </article>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-extrabold text-slate-600">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
