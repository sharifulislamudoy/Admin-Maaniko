"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Check,
  ImageIcon,
  Link2,
  Loader2,
  PackageSearch,
  Search,
  Type,
} from "lucide-react";

import type { BannerPayload } from "@/types/catalog";

import ImageUploader from "./ImageUploader";
import {
  Field,
  FormSection,
  inputClass,
  ContentField,
  TwoColumns,
} from "./FormUi";

type TargetKind = "product" | "combo";

type CatalogTarget = {
  id: string;
  kind: TargetKind;
  title: string;
  slug: string;
  sku: string;
  image: string;
  href: string;
};

type CatalogApiRow = Record<string, unknown> & {
  id?: string;
  slug?: string;
  sku?: string;
  name?: string;
  images?: Array<string | { url?: string }>;
  imageRecords?: Array<{ url?: string }>;
};

function firstImage(row: CatalogApiRow) {
  const recordImage = row.imageRecords?.[0]?.url;
  if (recordImage) return recordImage;

  const image = row.images?.[0];
  if (typeof image === "string") return image;
  return image?.url ?? "";
}

function makeTarget(
  row: CatalogApiRow,
  kind: TargetKind,
): CatalogTarget | null {
  const id = String(row.id ?? "");
  const slug = String(row.slug ?? "");
  if (!id || !slug) return null;

  return {
    id,
    kind,
    slug,
    sku: String(row.sku ?? ""),
    title: row.name || row.name || slug,
    image: firstImage(row),
    href: kind === "product" ? `/products/${slug}` : `/solution-box/${slug}`,
  };
}

function BannerTargetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (href: string) => void;
}) {
  const [targets, setTargets] = useState<CatalogTarget[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TargetKind>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTargets() {
      setLoading(true);
      setError("");

      try {
        const [productsResponse, combosResponse] = await Promise.all([
          fetch("/api/catalog/products", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/catalog/combos", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const [productsBody, combosBody] = await Promise.all([
          productsResponse.json(),
          combosResponse.json(),
        ]);

        if (!productsResponse.ok || !combosResponse.ok) {
          throw new Error("পণ্য ও সল্যুশন বক্সের তালিকা লোড করা যায়নি।");
        }

        const productTargets = (productsBody as CatalogApiRow[])
          .map((row) => makeTarget(row, "product"))
          .filter((item): item is CatalogTarget => Boolean(item));

        const comboTargets = (combosBody as CatalogApiRow[])
          .map((row) => makeTarget(row, "combo"))
          .filter((item): item is CatalogTarget => Boolean(item));

        setTargets([...productTargets, ...comboTargets]);
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "লিংকের তালিকা লোড করা যায়নি।",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTargets();
    return () => controller.abort();
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return targets
      .filter((target) => filter === "all" || target.kind === filter)
      .filter((target) => {
        if (!needle) return false;
        return [target.title, target.slug, target.sku].some((text) =>
          text.toLowerCase().includes(needle),
        );
      })
      .slice(0, 8);
  }, [filter, query, targets]);

  const selected = targets.find((target) => target.href === value);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
      <div>
        <p className="text-sm font-extrabold text-slate-700">
          পণ্য অথবা সল্যুশন বক্স খুঁজুন
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          একটি item নির্বাচন করলে তার সঠিক frontend route নিজে থেকেই লিংক হিসেবে
          বসবে।
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "সব"],
            ["product", "Product"],
            ["combo", "সল্যুশন বক্স"],
          ] as const
        ).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            onClick={() => setFilter(kind)}
            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
              filter === kind
                ? "border-[#ef4277] bg-rose-50 text-[#d93870]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#ef4277]" />
        ) : (
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="নাম, slug অথবা SKU দিয়ে খুঁজুন..."
          className={`${inputClass} pl-10`}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      )}

      {selected && !query.trim() && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          {selected.image ? (
            <img
              src={selected.image}
              alt=""
              className="size-11 rounded-lg border border-white object-cover"
            />
          ) : (
            <span className="grid size-11 place-items-center rounded-lg bg-white text-emerald-600">
              {selected.kind === "product" ? (
                <PackageSearch className="size-5" />
              ) : (
                <Box className="size-5" />
              )}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#062a54]">
              {selected.title}
            </p>
            <p className="truncate text-xs font-semibold text-emerald-700">
              নির্বাচিত: {selected.href}
            </p>
          </div>
          <Check className="size-5 shrink-0 text-emerald-600" />
        </div>
      )}

      {query.trim() && !loading && (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              কোনো matching পণ্য বা সল্যুশন বক্স পাওয়া যায়নি।
            </p>
          ) : (
            results.map((target) => {
              const isSelected = target.href === value;
              return (
                <button
                  key={`${target.kind}-${target.id}`}
                  type="button"
                  onClick={() => {
                    onChange(target.href);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 hover:border-[#ef4277]/50 hover:bg-rose-50/50"
                  }`}
                >
                  {target.image ? (
                    <img
                      src={target.image}
                      alt=""
                      className="size-12 rounded-lg border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      {target.kind === "product" ? (
                        <PackageSearch className="size-5" />
                      ) : (
                        <Box className="size-5" />
                      )}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-[#062a54]">
                      {target.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {target.kind === "product" ? "Product" : "সল্যুশন বক্স"}
                      {target.sku ? ` • ${target.sku}` : ""}
                    </span>
                  </span>

                  {isSelected && (
                    <Check className="size-5 shrink-0 text-emerald-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function BannerForm({
  value,
  onChange,
}: {
  value: BannerPayload;
  onChange: (value: BannerPayload) => void;
}) {
  const [titleEnabled, setTitleEnabled] = useState(() =>
    Boolean(value.title.trim() || value.title.trim()),
  );
  const [buttonEnabled, setButtonEnabled] = useState(() =>
    Boolean(value.buttonLabel.trim() || value.link.trim()),
  );

  function changeTitleOption(enabled: boolean) {
    setTitleEnabled(enabled);
    if (!enabled) onChange({ ...value, title: "" });
  }

  function changeButtonOption(enabled: boolean) {
    setButtonEnabled(enabled);
    onChange(
      enabled
        ? {
            ...value,
            buttonLabel: value.buttonLabel.trim()
              ? value.buttonLabel
              : "বিস্তারিত দেখুন",
          }
        : { ...value, buttonLabel: "", link: "" },
    );
  }

  return (
    <div className="space-y-4">
      <FormSection
        title="1. Banner identity"
        description="কোথায় দেখাবে এবং কোন নামে চিনবেন"
      >
        <div className="space-y-4">
          <TwoColumns>
            <Field
              label="Banner name / Key"
              hint="শুধু ইংরেজি ছোট হাতের অক্ষর ও dash ব্যবহার করুন।"
              required
            >
              <input
                value={value.key}
                onChange={(event) =>
                  onChange({ ...value, key: event.target.value })
                }
                placeholder="pregnancy-home"
                className={inputClass}
              />
            </Field>

            <Field label="Placement" required>
              <select
                value={value.placement}
                onChange={(event) =>
                  onChange({
                    ...value,
                    placement: event.target.value as BannerPayload["placement"],
                  })
                }
                className={inputClass}
              >
                <option value="HOME_HERO">হোম পেজের উপরে</option>
                <option value="SHOP_HERO">শপ পেজের উপরে</option>
                <option value="GUIDE_HERO">গাইড পেজের উপরে</option>
                <option value="SOLUTION_GUIDE">
                  হোম পেজের Solution Guide section
                </option>
              </select>
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field
              label="Color tone"
              hint="Overlay ও button-এর accent color।"
            >
              <select
                value={value.tone}
                onChange={(event) =>
                  onChange({ ...value, tone: event.target.value })
                }
                className={inputClass}
              >
                <option value="pink">Pink</option>
                <option value="blue">Blue</option>
              </select>
            </Field>

            <Field label="Display order" hint="কম নম্বরের ব্যানার আগে দেখাবে।">
              <input
                type="number"
                min={0}
                value={value.sortOrder}
                onChange={(event) =>
                  onChange({ ...value, sortOrder: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
          </TwoColumns>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <input
              type="checkbox"
              checked={value.isPublished}
              onChange={(event) =>
                onChange({ ...value, isPublished: event.target.checked })
              }
              className="size-4 accent-[#ef4277]"
            />
            <span>
              <span className="block text-sm font-extrabold text-slate-700">
                এখনই প্রকাশ করুন
              </span>
              <span className="block text-xs text-slate-500">
                বন্ধ রাখলে banner database-এ থাকবে, website-এ দেখাবে না।
              </span>
            </span>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="2. Banner images"
        description="ডেস্কটপ এবং মোবাইল/ট্যাবলেটের জন্য আলাদা ছবি দিন"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700">
              <ImageIcon className="size-4 text-[#ef4277]" /> ডেস্কটপ ছবি
              <span className="text-rose-500">*</span>
            </div>
            <ImageUploader
              folder="banners"
              multiple={false}
              images={
                value.desktopImage
                  ? [{ url: value.desktopImage, publicId: value.publicId }]
                  : []
              }
              onChange={(images) =>
                onChange({
                  ...value,
                  desktopImage: images[0]?.url ?? "",
                  publicId: images[0]?.publicId,
                })
              }
              label="Upload desktop banner"
              help="Recommended size: 1920 × 800px"
              expectedSize={{
                width: 1920,
                height: 800,
                label: "ডেস্কটপ ব্যানার",
              }}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700">
              <ImageIcon className="size-4 text-sky-600" /> মোবাইল ও ট্যাবলেট
              ছবি
            </div>
            <ImageUploader
              folder="banners"
              multiple={false}
              images={
                value.mobileImage
                  ? [{ url: value.mobileImage, publicId: value.mobilePublicId }]
                  : []
              }
              onChange={(images) =>
                onChange({
                  ...value,
                  mobileImage: images[0]?.url ?? "",
                  mobilePublicId: images[0]?.publicId,
                })
              }
              label="Upload mobile/tablet banner"
              help="Recommended size: 1920 × 1080px"
              expectedSize={{
                width: 1920,
                height: 1080,
                label: "মোবাইল ও ট্যাবলেট ব্যানার",
              }}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="3. Banner copy"
        description="ছবির ওপর HTML text হিসেবে দেখানো হবে; ছবিতে text বসাবেন না"
      >
        <div className="space-y-4">
          <ContentField
            label="Eyebrow text (optional)"
            value={value.eyebrow}
            onChange={(eyebrow) => onChange({ ...value, eyebrow })}
          />

          <Field
            label="Show banner title?"
            hint="না নির্বাচন করলে মূল শিরোনাম render হবে না।"
          >
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={titleEnabled ? "yes" : "no"}
                onChange={(event) =>
                  changeTitleOption(event.target.value === "yes")
                }
                className={`${inputClass} pl-10`}
              >
                <option value="no">না, শিরোনাম দেখাব না</option>
                <option value="yes">হ্যাঁ, শিরোনাম যোগ করব</option>
              </select>
            </div>
          </Field>

          {titleEnabled && (
            <ContentField
              label="Main title"
              value={value.title}
              onChange={(title) => onChange({ ...value, title })}
            />
          )}

          <ContentField
            label="Short description (optional)"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
            multiline
          />
        </div>
      </FormSection>

      <FormSection
        title="4. Button and destination"
        description="Button দেখাবেন কি না এবং ক্লিক করলে কোথায় যাবে"
      >
        <div className="space-y-4">
          <Field label="Show button?">
            <select
              value={buttonEnabled ? "yes" : "no"}
              onChange={(event) =>
                changeButtonOption(event.target.value === "yes")
              }
              className={inputClass}
            >
              <option value="no">না, কোনো বাটন দেখাব না</option>
              <option value="yes">হ্যাঁ, বাটন দেখাব</option>
            </select>
          </Field>

          {buttonEnabled && (
            <>
              <ContentField
                label="Button label"
                value={value.buttonLabel}
                onChange={(buttonLabel) => onChange({ ...value, buttonLabel })}
                required
              />

              <BannerTargetPicker
                value={value.link}
                onChange={(link) => onChange({ ...value, link })}
              />

              <Field
                label="Link / Route"
                hint="Search থেকে নির্বাচন করলে নিজে বসবে। প্রয়োজনে /shop, #shop-products বা external URL-ও লিখতে পারবেন।"
              >
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={value.link}
                    onChange={(event) =>
                      onChange({ ...value, link: event.target.value })
                    }
                    placeholder="/products/product-slug"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
            </>
          )}
        </div>
      </FormSection>

      <FormSection
        title="5. Schedule"
        description="কতদিন banner website-এ সক্রিয় থাকবে"
      >
        <TwoColumns>
          <Field label="Starts at" hint="ফাঁকা রাখলে এখন থেকেই দেখাবে।">
            <input
              type="datetime-local"
              value={value.startsAt ?? ""}
              onChange={(event) =>
                onChange({ ...value, startsAt: event.target.value || null })
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Ends at"
            hint="ফাঁকা রাখলে কোনো শেষ তারিখ থাকবে না।"
          >
            <input
              type="datetime-local"
              value={value.endsAt ?? ""}
              onChange={(event) =>
                onChange({ ...value, endsAt: event.target.value || null })
              }
              className={inputClass}
            />
          </Field>
        </TwoColumns>
      </FormSection>
    </div>
  );
}
