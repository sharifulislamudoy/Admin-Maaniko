"use client";

import type { ReactNode } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ContentText } from "@/types/catalog";

export const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-[#ef4277] focus:ring-4 focus:ring-[#ef4277]/10";

export const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ef4277] focus:ring-4 focus:ring-[#ef4277]/10";

export function FormSection({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <span>
          <span className="block text-base font-black text-[#062a54]">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              {description}
            </span>
          )}
        </span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
        {children}
      </div>
    </details>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-extrabold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TwoColumns({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function ContentField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  placeholders,
}: {
  label: string;
  value: ContentText;
  onChange: (value: ContentText) => void;
  multiline?: boolean;
  required?: boolean;
  placeholders?: string;
}) {
  const Component = multiline ? "textarea" : "input";
  const className = multiline ? textareaClass : inputClass;
  return (
    <div>
      <Field label={label} required={required}>
        <Component
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholders}
          className={className}
        />
      </Field>
    </div>
  );
}

export function ContentListEditor({
  title,
  items,
  onChange,
  addLabel = "নতুন পয়েন্ট যোগ করুন",
}: {
  title: string;
  items: ContentText[];
  onChange: (items: ContentText[]) => void;
  addLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-slate-700">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700 transition hover:bg-sky-100"
        >
          <Plus className="size-3.5" /> {addLabel}
        </button>
      </div>
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
          এখনো কোনো পয়েন্ট যোগ করা হয়নি।
        </p>
      )}
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black text-slate-500">
              পয়েন্ট {index + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
              className="grid size-8 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
              aria-label="পয়েন্ট বাদ দিন"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <ContentField
            label="Text"
            value={item}
            onChange={(next) =>
              onChange(
                items.map((old, itemIndex) =>
                  itemIndex === index ? next : old,
                ),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function RemoveButton({
  onClick,
  label = "Remove",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
    >
      <Trash2 className="size-3.5" /> {label}
    </button>
  );
}
