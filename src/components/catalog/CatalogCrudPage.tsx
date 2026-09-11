"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import {
  createTemplate,
  payloadFromRow,
  toBanglaPayload,
} from "@/lib/catalog-editor";
import type {
  BannerPayload,
  CatalogPayload,
  CatalogResource,
  CatalogRow,
  ComboPayload,
  ProductOption,
  ProductPayload,
} from "@/types/catalog";
import CatalogEditorModal from "./CatalogEditorModal";

const resourceCopy: Record<
  CatalogResource,
  { title: string; singular: string; description: string }
> = {
  products: {
    title: "পণ্যসমূহ",
    singular: "Product",
    description:
      "পণ্যের তথ্য, দাম, ছবি, স্টক ও ভ্যারিয়েন্ট সহজে পরিচালনা করুন।",
  },
  combos: {
    title: "সল্যুশন বক্সসমূহ",
    singular: "সল্যুশন বক্স",
    description:
      "পণ্য নির্বাচন করে নতুন বান্ডেল বানান এবং বিস্তারিত তথ্য সম্পাদনা করুন।",
  },
  banners: {
    title: "ব্যানারসমূহ",
    singular: "ব্যানার",
    description: "হোম ও শপ পেজের ডেস্কটপ/মোবাইল ব্যানার পরিচালনা করুন।",
  },
};

const statusCopy: Record<string, string> = {
  DRAFT: "খসড়া",
  ACTIVE: "সক্রিয়",
  ARCHIVED: "আর্কাইভ",
};

function rowName(row: CatalogRow) {
  return String(row.name ?? row.title ?? row.key ?? row.slug ?? row.id);
}

function rowImage(row: CatalogRow) {
  const images = Array.isArray(row.images) ? row.images : [];
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first)
    return String(first.url);
  return String(row.desktopImage ?? row.imageUrl ?? "");
}

function validate(resource: CatalogResource, payload: CatalogPayload) {
  if (resource === "banners") {
    const banner = payload as BannerPayload;
    if (!banner.key.trim()) return "ব্যানারের নাম / Key লিখুন।";
    if (!banner.desktopImage) return "Desktop banner-এর ছবি আপলোড করুন।";
    if (
      banner.startsAt &&
      banner.endsAt &&
      new Date(banner.startsAt) > new Date(banner.endsAt)
    )
      return "শেষ হওয়ার সময় শুরুর সময়ের পরে হতে হবে।";
  }
  if (resource === "products") {
    const product = payload as ProductPayload;
    if (!product.name.trim()) return "পণ্যের বাংলা নাম লিখুন।";
    if (!product.slug || !product.sku) return "পণ্যের Slug ও SKU লিখুন।";
    if (!product.description.trim()) return "পণ্যের বাংলা বিবরণ লিখুন।";
    if (!product.category.slug || !product.category.name)
      return "ক্যাটাগরির সব তথ্য পূরণ করুন।";
    if (product.images.length === 0) return "অন্তত একটি পণ্যের ছবি আপলোড করুন।";
    if (
      product.attributes.some(
        (attribute) =>
          !attribute.name ||
          attribute.values.length === 0 ||
          attribute.values.some((item) => !item.value),
      )
    )
      return "প্রতিটি অ্যাট্রিবিউটের বাংলা নাম এবং অন্তত একটি পূর্ণ ভ্যালু দিন।";
    if (
      product.variants.some(
        (variant) =>
          !variant.sku ||
          variant.selections.length !== product.attributes.length ||
          variant.selections.some((item) => !item.attribute || !item.value),
      )
    )
      return "প্রতিটি variant-এর SKU এবং সব option নির্বাচন করুন।";
  }
  if (resource === "combos") {
    const combo = payload as ComboPayload;
    if (!combo.name.trim()) return "সল্যুশন বক্সের বাংলা নাম লিখুন।";
    if (!combo.slug || !combo.sku) return "Solution Box-এর Slug ও SKU লিখুন।";
    if (!combo.subtitle || !combo.description)
      return "সাবটাইটেল ও বাংলা বিবরণ পূরণ করুন।";
    if (!combo.journeyStage || !combo.journeyStage)
      return "Journey stage লিখুন।";
    if (combo.images.length === 0)
      return "অন্তত একটি Solution Box-এর ছবি আপলোড করুন।";
    if (
      combo.items.length === 0 ||
      combo.items.some((item) => !item.productId || item.quantity < 1)
    )
      return "Box-এর ভেতরে অন্তত একটি valid পণ্য যোগ করুন।";
  }
  return "";
}

export default function CatalogCrudPage({
  resource,
}: {
  resource: CatalogResource;
}) {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CatalogRow | null | undefined>(
    undefined,
  );
  const [payload, setPayload] = useState<CatalogPayload>(() =>
    createTemplate(resource),
  );
  const [error, setError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [
        fetch(`/api/catalog/${resource}`, { cache: "no-store" }),
      ];
      if (resource === "combos")
        requests.push(fetch("/api/catalog/products", { cache: "no-store" }));
      const responses = await Promise.all(requests);
      const body = await responses[0].json();
      if (!responses[0].ok)
        throw new Error(body.message ?? "তথ্য load করা যায়নি");
      setRows(body);
      if (responses[1]) {
        const productBody = await responses[1].json();
        if (!responses[1].ok)
          throw new Error(productBody.message ?? "Product list load করা যায়নি");
        setProducts(productBody);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "তথ্য load করা যায়নি",
      );
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [rowName(row), row.sku, row.key, row.slug, row.status].some((item) =>
        String(item ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [query, rows]);

  function openCreate() {
    setPayload(createTemplate(resource));
    setEditing(null);
    setError("");
  }

  function openEdit(row: CatalogRow) {
    setPayload(payloadFromRow(resource, row));
    setEditing(row);
    setError("");
  }

  function closeEditor() {
    if (!saving) {
      setEditing(undefined);
      setError("");
    }
  }

  async function save() {
    const validationError = validate(resource, payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editing
          ? `/api/catalog/${resource}/${editing.id}`
          : `/api/catalog/${resource}`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toBanglaPayload(payload)),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(", ")
            : (body.message ?? "সংরক্ষণ করা যায়নি"),
        );
      setEditing(undefined);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "তথ্য save করা যায়নি",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: CatalogRow) {
    if (!window.confirm(`“${rowName(row)}” স্থায়ীভাবে delete করতে চান?`))
      return;
    setError("");
    const response = await fetch(`/api/catalog/${resource}/${row.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Delete করা যায়নি");
      return;
    }
    await load();
  }

  async function toggleBannerStatus(row: CatalogRow) {
    const nextStatus = !Boolean(row.isPublished);
    setUpdatingStatusId(row.id);
    setError("");

    try {
      const response = await fetch(`/api/catalog/banners/${row.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextStatus }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(", ")
            : (body.message ?? "Status পরিবর্তন করা যায়নি"),
        );
      }

      setRows((currentRows) =>
        currentRows.map((item) =>
          item.id === row.id
            ? { ...item, ...body, isPublished: nextStatus }
            : item,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Status পরিবর্তন করা যায়নি",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const copy = resourceCopy[resource];
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ef4277]">
            ডেটাবেজ ক্যাটালগ
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#062a54]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{copy.description}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#ef4277] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#ef4277]/20 transition hover:-translate-y-0.5 hover:bg-[#dc3267]"
        >
          <Plus className="size-4" /> নতুন {copy.singular} যোগ করুন
        </button>
      </div>

      {error && editing === undefined && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-3 border-b border-slate-200 p-4">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${copy.singular} খুঁজুন...`}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <button
            onClick={() => void load()}
            className="grid size-11 place-items-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCcw className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2 className="size-7 animate-spin text-[#ef4277]" />
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-4 text-center">
            <div>
              <ImageIcon className="mx-auto size-9 text-slate-300" />
              <p className="mt-3 font-bold text-slate-600">
                কোনো {copy.singular} পাওয়া যায়নি
              </p>
              <p className="mt-1 text-sm text-slate-400">
                নতুন একটি যোগ করুন অথবা search পরিবর্তন করুন।
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">নাম</th>
                  <th className="px-6 py-4">আইডেন্টিফায়ার</th>
                  <th className="px-6 py-4">অবস্থা</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => {
                  const image = rowImage(row);
                  return (
                    <tr key={row.id} className="transition hover:bg-rose-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              className="size-11 rounded-xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <span className="grid size-11 place-items-center rounded-xl bg-slate-100">
                              <ImageIcon className="size-4 text-slate-400" />
                            </span>
                          )}
                          <span className="font-black text-[#062a54]">
                            {rowName(row)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {String(row.sku ?? row.key ?? row.slug ?? "—")}
                      </td>
                      <td className="px-6 py-4">
                        {resource === "banners" ? (
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={Boolean(row.isPublished)}
                              aria-label={`${rowName(row)} ${row.isPublished ? "বন্ধ" : "চালু"} করুন`}
                              disabled={updatingStatusId === row.id}
                              onClick={() => void toggleBannerStatus(row)}
                              className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ef4277]/20 disabled:cursor-wait disabled:opacity-60 ${
                                row.isPublished
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`absolute top-1 grid size-5 place-items-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                  row.isPublished
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              >
                                {updatingStatusId === row.id && (
                                  <Loader2 className="size-3 animate-spin text-slate-500" />
                                )}
                              </span>
                            </button>
                            <span
                              className={`text-xs font-extrabold ${row.isPublished ? "text-emerald-700" : "text-slate-500"}`}
                            >
                              {row.isPublished ? "চালু" : "বন্ধ"}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${row.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {statusCopy[String(row.status ?? "DRAFT")] ??
                              String(row.status ?? "DRAFT")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(row)}
                            className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                            aria-label="সম্পাদনা করুন"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => void remove(row)}
                            className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                            aria-label="মুছে দিন"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CatalogEditorModal
        open={editing !== undefined}
        resource={resource}
        editing={editing !== null && editing !== undefined}
        value={payload}
        products={products}
        saving={saving}
        error={editing !== undefined ? error : ""}
        onChange={setPayload}
        onClose={closeEditor}
        onSave={() => void save()}
      />
    </div>
  );
}
