"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Guide, GuideCategory, GuideStatus } from "@/types/guide";
import { Field, inputClass, textareaClass } from "@/components/catalog/forms/FormUi";
import ImageUploader from "@/components/catalog/forms/ImageUploader";
import { guideAdminRequest } from "./guide-admin";

type FormValue = {
  title: string;
  slug: string;
  categoryId: string;
  excerpt: string;
  coverImage: string;
  coverPublicId: string | null;
  content: string;
  points: string;
  sources: string;
  status: GuideStatus;
  featured: boolean;
  popular: boolean;
};

function serializeContent(guide?: Guide) {
  if (!guide) return "";
  const showHeadings =
    guide.sections.length > 1 || guide.sections[0]?.title !== "বিস্তারিত";
  return guide.sections
    .map((section) =>
      [showHeadings ? `## ${section.title}` : "", section.body]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

function parseSections(content: string, points: string) {
  const pointList = points
    .split("\n")
    .map((point) => point.trim())
    .filter(Boolean);
  const parts = content.trim().split(/(?=^##\s+)/m).filter(Boolean);
  const hasHeadings = parts.some((part) => part.startsWith("## "));
  if (!hasHeadings)
    return [{ title: "বিস্তারিত", body: content.trim(), points: pointList }];
  return parts.map((part, index) => {
    const lines = part.trim().split("\n");
    const heading = lines[0].startsWith("## ")
      ? lines.shift()!.slice(3).trim()
      : "বিস্তারিত";
    return {
      title: heading || "বিস্তারিত",
      body: lines.join("\n").trim(),
      points: index === parts.length - 1 ? pointList : [],
    };
  });
}

function initialValue(guide: Guide | undefined, categoryId: string): FormValue {
  return {
    title: guide?.title ?? "",
    slug: guide?.slug ?? `guide-${Date.now()}`,
    categoryId: guide?.categoryId ?? categoryId,
    excerpt: guide?.excerpt ?? "",
    coverImage: guide?.coverImage ?? "",
    coverPublicId: guide?.coverPublicId ?? null,
    content: serializeContent(guide),
    points: guide?.sections.flatMap((section) => section.points).join("\n") ?? "",
    sources: guide?.sources.map((source) => `${source.label} | ${source.url}`).join("\n") ?? "",
    status: guide?.status ?? "ACTIVE",
    featured: guide?.featured ?? false,
    popular: guide?.popular ?? false,
  };
}

function parseSources(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator < 1) throw new Error("Source format must be: Name | https://link.com");
      const label = line.slice(0, separator).trim();
      const url = line.slice(separator + 1).trim();
      if (!label || !/^https:\/\//i.test(url))
        throw new Error("Every source needs a name and a valid HTTPS link.");
      return { label, url };
    });
}

export default function GuideEditor({
  guide,
  categories,
  onClose,
  onSaved,
}: {
  guide?: Guide;
  categories: GuideCategory[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(() => initialValue(guide, categories[0]?.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function change<K extends keyof FormValue>(key: K, next: FormValue[K]) {
    setValue((old) => ({ ...old, [key]: next }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.coverImage) {
      setError("Please upload a cover image.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const wordCount = `${value.content} ${value.points}`.trim().split(/\s+/).filter(Boolean).length;
      await guideAdminRequest(`guides${guide ? `/${guide.id}` : ""}`, {
        method: guide ? "PATCH" : "POST",
        body: JSON.stringify({
          slug: value.slug.trim(),
          title: value.title.trim(),
          excerpt: value.excerpt.trim(),
          coverImage: value.coverImage,
          coverPublicId: value.coverPublicId,
          coverAlt: value.title.trim(),
          authorName: "Maaniko তথ্য সংকলন",
          readMinutes: Math.max(1, Math.ceil(wordCount / 180)),
          pdfUrl: null,
          pageCount: null,
          status: value.status,
          featured: value.featured,
          popular: value.popular,
          sortOrder: guide?.sortOrder ?? 0,
          publishedAt: guide?.publishedAt ?? null,
          reviewedAt: guide?.reviewedAt ?? null,
          categoryId: value.categoryId,
          sections: parseSections(value.content, value.points),
          sources: parseSources(value.sources),
        }),
      });
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Guide could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[94dvh] w-[calc(100%-24px)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/60">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-xl font-black text-[#062a54]">{guide ? "Edit guide" : "Add new guide"}</h2>
          <p className="mt-1 text-xs text-slate-500">Only the fields needed on the website are shown.</p>
        </div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
      </div>

      <form onSubmit={(event) => void save(event)} className="space-y-5 p-5">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" required>
              <input required maxLength={240} value={value.title} onChange={(event) => change("title", event.target.value)} className={inputClass} placeholder="বাংলায় গাইডের শিরোনাম" />
            </Field>
            <Field label="Category" required>
              <select required value={value.categoryId} onChange={(event) => change("categoryId", event.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Short description" required hint="This appears below the title and on the guide card.">
            <textarea required maxLength={1200} value={value.excerpt} onChange={(event) => change("excerpt", event.target.value)} className={textareaClass} placeholder="গাইডটি সম্পর্কে ২–৩ লাইনে লিখুন" />
          </Field>

          <Field label="Cover image" required>
            <ImageUploader folder="guides" multiple={false} label="Upload cover image" images={value.coverImage ? [{ url: value.coverImage, publicId: value.coverPublicId ?? undefined }] : []} onChange={(images) => { change("coverImage", images[0]?.url ?? ""); change("coverPublicId", images[0]?.publicId ?? null); }} />
          </Field>

          <Field label="Guide content" required hint="Use blank lines between paragraphs. Optional section heading: ## শিরোনাম">
            <textarea required maxLength={12000} value={value.content} onChange={(event) => change("content", event.target.value)} className={`${textareaClass} min-h-64`} placeholder="সম্পূর্ণ গাইডের লেখা বাংলায় লিখুন…" />
          </Field>

          <Field label="Key points (optional)" hint="Write one point per line.">
            <textarea value={value.points} onChange={(event) => change("points", event.target.value)} className={textareaClass} placeholder={"প্রথম গুরুত্বপূর্ণ পয়েন্ট\nদ্বিতীয় গুরুত্বপূর্ণ পয়েন্ট"} />
          </Field>

          <Field label="Sources (optional)" hint="One source per line: Name | https://link.com">
            <textarea value={value.sources} onChange={(event) => change("sources", event.target.value)} className={textareaClass} placeholder="WHO | https://www.who.int/" />
          </Field>

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-[#062a54]">Advanced options</summary>
            <div className="mt-4 space-y-4">
              <Field label="URL slug" required hint="Normally you do not need to change this.">
                <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} value={value.slug} onChange={(event) => change("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={inputClass} />
              </Field>
              <Field label="Status">
                <select value={value.status} onChange={(event) => change("status", event.target.value as GuideStatus)} className={inputClass}>
                  <option value="ACTIVE">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option>
                </select>
              </Field>
              <div className="flex flex-wrap gap-6 text-sm font-semibold">
                <label className="flex items-center gap-2"><input type="checkbox" checked={value.featured} onChange={(event) => change("featured", event.target.checked)} /> Featured guide</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={value.popular} onChange={(event) => change("popular", event.target.checked)} /> Popular guide</label>
              </div>
            </div>
          </details>
        </fieldset>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white py-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold">Cancel</button>
          <button type="submit" disabled={busy || !categories.length} className="rounded-xl bg-[#ef4277] px-6 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : guide ? "Save changes" : "Publish guide"}</button>
        </div>
      </form>
    </dialog>
  );
}
