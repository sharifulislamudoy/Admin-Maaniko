"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Field, inputClass, textareaClass } from "@/components/catalog/forms/FormUi";

type Page = {
  id: string;
  slug: string;
  category: "SUPPORT" | "POLICY" | "COMPANY";
  title: string;
  eyebrow: string | null;
  summary: string | null;
  isPublished: boolean;
  sortOrder: number;
  sections: Array<{ id?: string; title: string; body: string }>;
};

export default function ContentPageEditor({ slug }: { slug: string }) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/content-pages", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Pages could not be loaded");
      const found = (data as Page[]).find((item) => item.slug === slug);
      if (!found) throw new Error("Page not found. Run the new Prisma migration first.");
      setPage(found);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Page could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save() {
    if (!page) return;
    if (!page.title.trim() || page.sections.some((section) => !section.title.trim() || !section.body.trim())) {
      setMessage("Title and every section field are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/content-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Page could not be saved");
      setPage(data);
      setMessage("Page content saved successfully.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Page could not be saved");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-72 place-items-center"><Loader2 className="size-7 animate-spin text-[#ef4277]" /></div>;
  if (!page) return <div className="rounded-2xl bg-rose-50 p-5 font-bold text-rose-700">{message}</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl bg-[#062a54] p-5 text-white sm:flex-row sm:items-end sm:justify-between md:p-7">
        <div><p className="text-xs font-black uppercase tracking-wider text-[#ff8aad]">Website content</p><h1 className="mt-1 text-2xl font-black">Edit: {page.title}</h1><p className="mt-1 text-xs text-white/60">Route: /{page.slug}</p></div>
        <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-black disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes</button>
      </header>

      {message ? <p className={`rounded-xl px-4 py-3 text-sm font-bold ${message.includes("successfully") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p> : null}

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Field label="Page title" required><input className={inputClass} value={page.title} onChange={(event) => setPage({ ...page, title: event.target.value })} /></Field>
        <Field label="Eyebrow"><input className={inputClass} value={page.eyebrow ?? ""} onChange={(event) => setPage({ ...page, eyebrow: event.target.value })} /></Field>
        <div className="md:col-span-2"><Field label="Summary"><textarea className={textareaClass} value={page.summary ?? ""} onChange={(event) => setPage({ ...page, summary: event.target.value })} /></Field></div>
        <Field label="Category"><select className={inputClass} value={page.category} onChange={(event) => setPage({ ...page, category: event.target.value as Page["category"] })}><option value="SUPPORT">Support</option><option value="POLICY">Policy</option><option value="COMPANY">Company</option></select></Field>
        <Field label="Visibility"><select className={inputClass} value={page.isPublished ? "yes" : "no"} onChange={(event) => setPage({ ...page, isPublished: event.target.value === "yes" })}><option value="yes">Published</option><option value="no">Hidden</option></select></Field>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#062a54]">Content sections</h2><p className="text-xs text-slate-500">Line breaks in body text are preserved on the website.</p></div><button type="button" onClick={() => setPage({ ...page, sections: [...page.sections, { title: "", body: "" }] })} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"><Plus className="size-4" /> Add section</button></div>
        <div className="mt-4 space-y-4">
          {page.sections.map((section, index) => (
            <div key={section.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-black text-slate-500">Section {index + 1}</span><button type="button" disabled={page.sections.length === 1} onClick={() => setPage({ ...page, sections: page.sections.filter((_, itemIndex) => itemIndex !== index) })} className="grid size-9 place-items-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="size-4" /></button></div>
              <div className="space-y-3"><Field label="Section title" required><input className={inputClass} value={section.title} onChange={(event) => setPage({ ...page, sections: page.sections.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} /></Field><Field label="Body" required><textarea className={`${textareaClass} min-h-40`} value={section.body} onChange={(event) => setPage({ ...page, sections: page.sections.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item) })} /></Field></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
