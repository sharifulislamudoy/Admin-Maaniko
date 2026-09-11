"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, RefreshCw, Search } from "lucide-react";
import type {
  Guide,
  GuideCategory,
  GuidePageContent,
  GuideStatus,
} from "@/types/guide";
import { inputClass } from "@/components/catalog/forms/FormUi";
import GuideEditor from "./GuideEditor";
import GuideSettingsEditor from "./GuideSettingsEditor";
import GuideCategoriesEditor from "./GuideCategoriesEditor";
import { guideAdminRequest, statusLabels } from "./guide-admin";

async function readData(signal?: AbortSignal) {
  const [guides, categories, content] = await Promise.all([
    guideAdminRequest<Guide[]>("guides", { signal }),
    guideAdminRequest<GuideCategory[]>("guide-categories", { signal }),
    guideAdminRequest<GuidePageContent | null>("guide-page", { signal }),
  ]);
  return { guides, categories, content };
}

export default function GuideManager() {
  const [data, setData] = useState<{
    guides: Guide[];
    categories: GuideCategory[];
    content: GuidePageContent | null;
  } | null>(null);
  const [tab, setTab] = useState<"guides" | "categories" | "page">("guides");
  const [editing, setEditing] = useState<Guide | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    const next = await readData(signal);
    if (!signal?.aborted) {
      setData(next);
      setError("");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void readData(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) {
          setData(next);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "তথ্য লোড করা যায়নি।",
          );
      });
    return () => controller.abort();
  }, [load]);

  async function action(operation: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await operation();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "কাজটি সম্পন্ন হয়নি।",
      );
    } finally {
      setBusy(false);
    }
  }
  const guides = (data?.guides ?? []).filter((guide) =>
    `${guide.title} ${guide.slug} ${guide.category.name}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  return (
    <div className="space-y-6 text-[#062a54]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#ef4277]">
            MAANIKO GUIDE
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold">
            <BookOpen /> গাইড পরিচালনা
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            গাইড, ক্যাটাগরি ও পেজের লেখা এখান থেকেই পরিবর্তন করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/banners"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            গাইড ব্যানার
          </Link>
          <button
            disabled={busy}
            onClick={() => void action(async () => undefined)}
            aria-label="রিফ্রেশ"
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <RefreshCw size={18} className={busy ? "animate-spin" : ""} />
          </button>
          <button
            disabled={!data?.categories.length || busy}
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-xl bg-[#ef4277] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            <Plus size={18} /> নতুন গাইড
          </button>
        </div>
      </header>
      <nav aria-label="গাইড ব্যবস্থাপনা" className="flex gap-2 overflow-auto">
        {(
          [
            ["guides", "গাইডসমূহ"],
            ["categories", "Category"],
            ["page", "পেজের লেখা"],
          ] as const
        ).map(([key, title]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold ${tab === key ? "bg-[#062a54] text-white" : "bg-white text-slate-600"}`}
          >
            {title}
          </button>
        ))}
      </nav>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {!data && !error && (
        <p role="status" className="rounded-xl bg-white p-6">
          তথ্য লোড হচ্ছে…
        </p>
      )}
      {data && tab === "guides" && (
        <>
          <label className="flex items-center gap-3">
            <Search size={20} />
            <input
              aria-label="গাইড খুঁজুন"
              placeholder="শিরোনাম, slug বা ক্যাটাগরি দিয়ে খুঁজুন"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
            />
          </label>
          <p className="text-sm text-slate-500">
            মোট {guides.length.toLocaleString("bn-BD")}টি গাইড
          </p>
          <div className="space-y-3">
            {guides.map((guide) => (
              <article
                key={guide.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{guide.title}</h2>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {guide.category.name} · /guide/{guide.slug}
                  </p>
                  <div className="mt-2 flex gap-2 text-xs text-rose-700">
                    {guide.featured && <span>বিশেষ গাইড</span>}
                    {guide.popular && <span>জনপ্রিয়</span>}
                    {guide.publishedAt &&
                      new Date(guide.publishedAt) > new Date() && (
                        <span>নির্ধারিত প্রকাশ</span>
                      )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className="sr-only"
                    htmlFor={`guide-status-${guide.id}`}
                  >
                    গাইডের অবস্থা
                  </label>
                  <select
                    id={`guide-status-${guide.id}`}
                    disabled={busy}
                    value={guide.status}
                    onChange={(event) =>
                      void action(() =>
                        guideAdminRequest(`guides/${guide.id}/status`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            status: event.target.value as GuideStatus,
                          }),
                        }),
                      )
                    }
                    className="rounded-lg border border-slate-200 p-2 text-sm"
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={busy}
                    onClick={() => setEditing(guide)}
                    className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700"
                  >
                    সম্পাদনা
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`“${guide.title}” গাইড মুছে ফেলবেন?`))
                        void action(() =>
                          guideAdminRequest(`guides/${guide.id}`, {
                            method: "DELETE",
                          }),
                        );
                    }}
                    className="px-2 py-2 text-sm font-bold text-rose-600"
                  >
                    মুছুন
                  </button>
                </div>
              </article>
            ))}
            {!guides.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                কোনো গাইড পাওয়া যায়নি।
              </div>
            )}
          </div>
        </>
      )}
      {data && tab === "categories" && (
        <GuideCategoriesEditor categories={data.categories} onSaved={load} />
      )}
      {data && tab === "page" && (
        <GuideSettingsEditor initial={data.content} onSaved={load} />
      )}
      {editing && data && (
        <GuideEditor
          guide={editing === "new" ? undefined : editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
