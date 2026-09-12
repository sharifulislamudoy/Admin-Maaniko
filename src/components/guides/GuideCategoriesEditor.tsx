"use client";

import { useState, type FormEvent } from "react";
import type { GuideCategory } from "@/types/guide";
import { Field, inputClass } from "@/components/catalog/forms/FormUi";
import { guideAdminRequest } from "./guide-admin";

export default function GuideCategoriesEditor({ categories, onSaved }: { categories: GuideCategory[]; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState<GuideCategory | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function reset() {
    setEditing(null);
    setName("");
    setSlug("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await guideAdminRequest(`guide-categories${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          sortOrder: editing?.sortOrder ?? categories.length,
          isPublished: editing?.isPublished ?? true,
        }),
      });
      await onSaved();
      reset();
      setMessage("Category saved.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Category could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(category: GuideCategory) {
    setBusy(true);
    setMessage("");
    try {
      await guideAdminRequest(`guide-categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...category, isPublished: !category.isPublished }),
      });
      await onSaved();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Category could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(event) => void save(event)} className="grid items-end gap-3 rounded-xl bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Category name" required>
          <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="যেমন: গর্ভকালীন যত্ন" />
        </Field>
        <Field label="URL slug" required hint="Small English letters and hyphens only.">
          <input required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={inputClass} placeholder="pregnancy-care" />
        </Field>
        <div className="flex gap-2">
          <button disabled={busy} type="submit" className="h-11 rounded-xl bg-[#062a54] px-5 font-bold text-white disabled:opacity-50">{editing ? "Save" : "Add"}</button>
          {editing && <button type="button" onClick={reset} className="h-11 px-3 text-sm font-bold">Cancel</button>}
        </div>
      </form>

      {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <button type="button" onClick={() => { setEditing(category); setName(category.name); setSlug(category.slug); }} className="text-sm font-bold">{category.name}</button>
            <button type="button" disabled={busy} onClick={() => void toggle(category)} className={`rounded-full px-2 py-1 text-[11px] font-bold ${category.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{category.isPublished ? "Visible" : "Hidden"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
