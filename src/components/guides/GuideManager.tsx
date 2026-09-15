"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, FolderCog, Plus, RefreshCw, Search } from "lucide-react";
import type { Guide, GuideCategory, GuideStatus } from "@/types/guide";
import { inputClass } from "@/components/catalog/forms/FormUi";
import GuideEditor from "./GuideEditor";
import GuideCategoriesEditor from "./GuideCategoriesEditor";
import { guideAdminRequest } from "./guide-admin";

async function readData(signal?: AbortSignal) {
  const [guides, categories] = await Promise.all([
    guideAdminRequest<Guide[]>("guides", { signal }),
    guideAdminRequest<GuideCategory[]>("guide-categories", { signal }),
  ]);
  return { guides, categories };
}

export default function GuideManager() {
  const [data, setData] = useState<{ guides: Guide[]; categories: GuideCategory[] } | null>(null);
  const [editing, setEditing] = useState<Guide | "new" | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await readData(signal);
      if (!signal?.aborted) {
        setData(next);
        setError("");
      }
    } catch (reason) {
      if (!signal?.aborted)
        setError(reason instanceof Error ? reason.message : "Data could not be loaded.");
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
          setError(reason instanceof Error ? reason.message : "Data could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  async function action(operation: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await operation();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const guides = (data?.guides ?? []).filter((guide) =>
    `${guide.title} ${guide.category.name}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  return (
    <div className="space-y-5 text-[#062a54]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black"><BookOpen /> Guides</h1>
          <p className="mt-1 text-sm text-slate-500">Add, edit and publish guides from one simple screen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/banners" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">Guide banners</Link>
          <button type="button" onClick={() => setShowCategories((old) => !old)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><FolderCog size={17} /> Categories</button>
          <button type="button" disabled={busy} onClick={() => void load()} aria-label="Refresh" className="rounded-xl border border-slate-200 bg-white p-2.5"><RefreshCw size={18} className={busy ? "animate-spin" : ""} /></button>
          <button type="button" disabled={!data?.categories.length || busy} onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-xl bg-[#ef4277] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Plus size={18} /> Add guide</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {!data && !error && <p className="rounded-xl bg-white p-6">Loading…</p>}

      {data && showCategories && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <GuideCategoriesEditor categories={data.categories} onSaved={() => load()} />
        </section>
      )}

      {data && (
        <>
          {!data.categories.length && (
            <button type="button" onClick={() => setShowCategories(true)} className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-left text-sm font-bold text-amber-800">Create a category before adding your first guide.</button>
          )}
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input aria-label="Search guides" placeholder="Search by title or category" value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-10`} />
          </label>
          <p className="text-sm text-slate-500">{guides.length.toLocaleString("en-US")} guides</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {guides.map((guide) => (
              <article key={guide.id} className="flex flex-wrap items-center gap-4 border-b border-slate-100 p-4 last:border-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={guide.coverImage} alt="" className="h-16 w-24 rounded-lg bg-slate-100 object-cover" />
                <div className="min-w-52 flex-1">
                  <h2 className="font-black">{guide.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{guide.category.name} · {guide.readMinutes} min read</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={guide.status === "ACTIVE"}
                    onChange={(event) => void action(() => guideAdminRequest(`guides/${guide.id}/status`, { method: "PATCH", body: JSON.stringify({ status: (event.target.checked ? "ACTIVE" : "DRAFT") as GuideStatus }) }))}
                    className="size-4 accent-[#ef4277]"
                  />
                  Published
                </label>
                <button type="button" disabled={busy} onClick={() => setEditing(guide)} className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700">Edit</button>
                <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Delete “${guide.title}”?`)) void action(() => guideAdminRequest(`guides/${guide.id}`, { method: "DELETE" })); }} className="px-2 py-2 text-sm font-bold text-rose-600">Delete</button>
              </article>
            ))}
            {!guides.length && <p className="p-10 text-center text-sm text-slate-500">No guides found.</p>}
          </div>
        </>
      )}

      {editing && data && (
        <GuideEditor guide={editing === "new" ? undefined : editing} categories={data.categories} onClose={() => setEditing(null)} onSaved={() => load()} />
      )}
    </div>
  );
}
