"use client";
import { useState, type FormEvent } from "react";
import type { GuideCategory } from "@/types/guide";
import { Field, inputClass } from "@/components/catalog/forms/FormUi";
import { guideAdminRequest } from "./guide-admin";

type CategoryInput = Pick<
  GuideCategory,
  "name" | "slug" | "sortOrder" | "isPublished"
>;
const blank: CategoryInput = {
  name: "",
  slug: "",
  sortOrder: 0,
  isPublished: true,
};

export default function GuideCategoriesEditor({
  categories,
  onSaved,
}: {
  categories: GuideCategory[];
  onSaved: () => Promise<void>;
}) {
  const [id, setId] = useState("");
  const [value, setValue] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await guideAdminRequest(`guide-categories${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(value),
      });
      await onSaved();
      setId("");
      setValue(blank);
      setMessage("ক্যাটাগরি সংরক্ষিত হয়েছে।");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "সংরক্ষণ করা যায়নি।",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(category: GuideCategory) {
    if (!window.confirm(`“${category.name}” ক্যাটাগরি মুছবেন?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await guideAdminRequest(`guide-categories/${category.id}`, {
        method: "DELETE",
      });
      await onSaved();
      if (id === category.id) {
        setId("");
        setValue(blank);
      }
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "মুছে ফেলা যায়নি।");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => void save(event)}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-bold">
          {id ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}
        </h2>
        <fieldset disabled={busy} className="grid gap-4 md:grid-cols-3">
          <Field label="Name" required>
            <input
              required
              maxLength={100}
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Slug" required>
            <input
              required
              maxLength={100}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={value.slug}
              onChange={(event) =>
                setValue({ ...value, slug: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              required
              min={0}
              max={100000}
              value={value.sortOrder}
              onChange={(event) =>
                setValue({ ...value, sortOrder: Number(event.target.value) })
              }
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.isPublished}
              onChange={(event) =>
                setValue({ ...value, isPublished: event.target.checked })
              }
            />{" "}
            প্রকাশিত
          </label>
        </fieldset>
        <p className="text-xs text-slate-500">
          ক্যাটাগরি বন্ধ করলে তার গাইডগুলোও ওয়েবসাইটে দেখা যাবে না।
        </p>
        <div className="flex gap-3">
          <button
            disabled={busy}
            type="submit"
            className="rounded-lg bg-[#ef4277] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            সংরক্ষণ
          </button>
          {id && (
            <button
              disabled={busy}
              type="button"
              onClick={() => {
                setId("");
                setValue(blank);
              }}
              className="px-3"
            >
              বাতিল
            </button>
          )}
        </div>
      </form>
      <p role="status" className="text-sm text-rose-700">
        {message}
      </p>
      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <h3 className="font-bold">
                {category.name}{" "}
                {!category.isPublished && (
                  <span className="text-xs text-slate-500">(লুকানো)</span>
                )}
              </h3>
              <p className="text-sm text-slate-500">{category.slug}</p>
            </div>
            <div className="flex gap-4">
              <button
                disabled={busy}
                onClick={() => {
                  setId(category.id);
                  setValue({
                    name: category.name,
                    slug: category.slug,
                    sortOrder: category.sortOrder,
                    isPublished: category.isPublished,
                  });
                }}
                className="text-sm font-bold text-sky-700"
              >
                সম্পাদনা
              </button>
              <button
                disabled={busy}
                onClick={() => void remove(category)}
                className="text-sm font-bold text-rose-600"
              >
                মুছুন
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
