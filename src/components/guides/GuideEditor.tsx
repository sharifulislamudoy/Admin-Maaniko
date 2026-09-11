"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { Guide, GuideCategory, GuideStatus } from "@/types/guide";
import {
  Field,
  FormSection,
  inputClass,
  textareaClass,
  TwoColumns,
  RemoveButton,
} from "@/components/catalog/forms/FormUi";
import ImageUploader from "@/components/catalog/forms/ImageUploader";
import {
  guideAdminRequest,
  statusLabels,
  toGuideInput,
  type GuideInput,
} from "./guide-admin";

function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(() =>
    toGuideInput(guide, categories[0]?.id),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, []);

  function change<K extends keyof GuideInput>(key: K, next: GuideInput[K]) {
    setValue((old) => ({ ...old, [key]: next }));
  }
  function moveSection(index: number, direction: number) {
    const next = [...value.sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    change("sections", next);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await guideAdminRequest(`guides${guide ? `/${guide.id}` : ""}`, {
        method: guide ? "PATCH" : "POST",
        body: JSON.stringify({
          ...value,
          pdfUrl: value.pdfUrl?.trim() || null,
          pageCount: value.pdfUrl ? value.pageCount : null,
          sections: value.sections.map((section) => ({
            ...section,
            points: section.points.map((point) => point.trim()).filter(Boolean),
          })),
        }),
      });
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "সংরক্ষণ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="guide-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-24px)] max-w-4xl overflow-y-auto rounded-2xl bg-slate-50 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/60"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <h2
          id="guide-editor-title"
          className="text-xl font-bold text-[#062a54]"
        >
          {guide ? "গাইড সম্পাদনা" : "নতুন গাইড"}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X />
        </button>
      </div>
      <form
        onSubmit={(event) => void save(event)}
        className="space-y-4 p-4 md:p-5"
      >
        <fieldset
          disabled={busy}
          className="min-w-0 space-y-4 disabled:opacity-70"
        >
          <FormSection title="Guide identity">
            <div className="space-y-4">
              <Field label="Title" required>
                <input
                  required
                  maxLength={240}
                  value={value.title}
                  onChange={(event) => change("title", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <TwoColumns>
                <Field
                  label="Slug"
                  hint="যেমন hospital-bag-checklist; ছোট ইংরেজি অক্ষর, সংখ্যা ও হাইফেন।"
                  required
                >
                  <input
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    maxLength={160}
                    value={value.slug}
                    onChange={(event) => change("slug", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Category" required>
                  <select
                    required
                    value={value.categoryId}
                    onChange={(event) =>
                      change("categoryId", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {!category.isPublished ? " (লুকানো)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </TwoColumns>
              <Field label="Short description" required>
                <textarea
                  required
                  maxLength={1200}
                  value={value.excerpt}
                  onChange={(event) => change("excerpt", event.target.value)}
                  className={textareaClass}
                />
              </Field>
              <TwoColumns>
                <Field label="Author / compiler" required>
                  <input
                    required
                    maxLength={120}
                    value={value.authorName}
                    onChange={(event) =>
                      change("authorName", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Read time (minutes)">
                  <input
                    required
                    type="number"
                    min={1}
                    max={120}
                    value={value.readMinutes}
                    onChange={(event) =>
                      change("readMinutes", Number(event.target.value))
                    }
                    className={inputClass}
                  />
                </Field>
              </TwoColumns>
            </div>
          </FormSection>
          <FormSection title="Cover image">
            <div className="space-y-4">
              <ImageUploader
                folder="guides"
                multiple={false}
                images={
                  value.coverImage
                    ? [{ url: value.coverImage, publicId: value.coverPublicId ?? undefined }]
                    : []
                }
                onChange={(images) => {
                  change("coverImage", images[0]?.url ?? "");
                  change("coverPublicId", images[0]?.publicId ?? null);
                }}
              />
              <Field label="Image description (alt text)" required>
                <input
                  required
                  maxLength={240}
                  value={value.coverAlt}
                  onChange={(event) => change("coverAlt", event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection
            title="Guide content"
            description="প্রতিটি অংশে শিরোনাম, অনুচ্ছেদ এবং প্রয়োজন হলে তালিকা লিখুন।"
          >
            <div className="space-y-4">
              {value.sections.map((section, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <strong>অংশ {index + 1}</strong>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="অংশ উপরে নিন"
                        disabled={index === 0}
                        onClick={() => moveSection(index, -1)}
                        className="p-2 disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="অংশ নিচে নিন"
                        disabled={index === value.sections.length - 1}
                        onClick={() => moveSection(index, 1)}
                        className="p-2 disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                      {value.sections.length > 1 && (
                        <RemoveButton
                          onClick={() =>
                            change(
                              "sections",
                              value.sections.filter((_, i) => i !== index),
                            )
                          }
                        />
                      )}
                    </div>
                  </div>
                  <Field label="Section title" required>
                    <input
                      required
                      maxLength={200}
                      value={section.title}
                      onChange={(event) =>
                        change(
                          "sections",
                          value.sections.map((item, i) =>
                            i === index
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Body text">
                    <textarea
                      maxLength={12000}
                      value={section.body}
                      onChange={(event) =>
                        change(
                          "sections",
                          value.sections.map((item, i) =>
                            i === index
                              ? { ...item, body: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={textareaClass}
                    />
                  </Field>
                  <Field
                    label="List points"
                    hint="প্রতি লাইনে একটি পয়েন্ট দিন।"
                  >
                    <textarea
                      value={section.points.join("\n")}
                      onChange={(event) =>
                        change(
                          "sections",
                          value.sections.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  points: event.target.value.split("\n"),
                                }
                              : item,
                          ),
                        )
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>
              ))}
              <button
                type="button"
                disabled={value.sections.length >= 40}
                onClick={() =>
                  change("sections", [
                    ...value.sections,
                    { title: "", body: "", points: [] },
                  ])
                }
                className="flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-2 font-semibold text-sky-800"
              >
                <Plus size={17} /> অংশ যোগ করুন
              </button>
            </div>
          </FormSection>
          <FormSection
            title="Sources"
            description="ব্যবহৃত উৎসের নাম ও সরাসরি HTTPS link দিন।"
          >
            <div className="space-y-4">
              {value.sources.map((source, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <TwoColumns>
                    <Field label="Source name" required>
                      <input
                        required
                        maxLength={200}
                        value={source.label}
                        onChange={(event) =>
                          change(
                            "sources",
                            value.sources.map((item, i) =>
                              i === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Source link" required>
                      <input
                        required
                        type="url"
                        pattern="https://.*"
                        maxLength={2000}
                        value={source.url}
                        onChange={(event) =>
                          change(
                            "sources",
                            value.sources.map((item, i) =>
                              i === index
                                ? { ...item, url: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </TwoColumns>
                  {value.sources.length > 1 && (
                    <RemoveButton
                      onClick={() =>
                        change(
                          "sources",
                          value.sources.filter((_, i) => i !== index),
                        )
                      }
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                disabled={value.sources.length >= 20}
                onClick={() =>
                  change("sources", [...value.sources, { label: "", url: "" }])
                }
                className="rounded-lg bg-sky-50 px-4 py-2 font-semibold text-sky-800"
              >
                আরও উৎস যোগ করুন
              </button>
            </div>
          </FormSection>
          <FormSection title="Publishing and PDF">
            <div className="space-y-4">
              <TwoColumns>
                <Field label="Status">
                  <select
                    value={value.status}
                    onChange={(event) =>
                      change("status", event.target.value as GuideStatus)
                    }
                    className={inputClass}
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Display order">
                  <input
                    required
                    type="number"
                    min={0}
                    max={100000}
                    value={value.sortOrder}
                    onChange={(event) =>
                      change("sortOrder", Number(event.target.value))
                    }
                    className={inputClass}
                  />
                </Field>
              </TwoColumns>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.featured}
                    onChange={(event) =>
                      change("featured", event.target.checked)
                    }
                  />{" "}
                  বিশেষ গাইড
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.popular}
                    onChange={(event) =>
                      change("popular", event.target.checked)
                    }
                  />{" "}
                  জনপ্রিয় তালিকায় আগে
                </label>
              </div>
              <TwoColumns>
                <Field
                  label="Published at"
                  hint="নতুন প্রকাশিত গাইডে ফাঁকা রাখলে বর্তমান সময় বসবে। ভবিষ্যতের সময় দিলে তখন দেখা যাবে।"
                >
                  <input
                    type="datetime-local"
                    value={localDate(value.publishedAt)}
                    onChange={(event) =>
                      change(
                        "publishedAt",
                        event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      )
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Reviewed at"
                  hint="তথ্য যাচাই করে থাকলেই তারিখ দিন।"
                >
                  <input
                    type="datetime-local"
                    value={localDate(value.reviewedAt)}
                    onChange={(event) =>
                      change(
                        "reviewedAt",
                        event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </TwoColumns>
              <TwoColumns>
                <Field
                  label="PDF link (optional)"
                  hint="প্রকাশ্যে খোলা যায় এমন আসল PDF-এর HTTPS link দিন।"
                >
                  <input
                    type="url"
                    pattern="https://.*"
                    maxLength={2000}
                    value={value.pdfUrl ?? ""}
                    onChange={(event) =>
                      change("pdfUrl", event.target.value || null)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="PDF page count">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    disabled={!value.pdfUrl}
                    value={value.pageCount ?? ""}
                    onChange={(event) =>
                      change(
                        "pageCount",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </TwoColumns>
            </div>
          </FormSection>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <div className="sticky bottom-0 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={busy || !categories.length}
            className="rounded-lg bg-[#ef4277] px-5 py-2 font-bold text-white disabled:opacity-50"
          >
            {busy ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
