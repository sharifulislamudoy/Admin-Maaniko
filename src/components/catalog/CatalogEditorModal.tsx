"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save, X } from "lucide-react";
import type {
  BannerPayload,
  CatalogPayload,
  CatalogResource,
  ComboPayload,
  ProductOption,
  ProductPayload,
} from "@/types/catalog";
import BannerForm from "./forms/BannerForm";
import ComboForm from "./forms/ComboForm";
import ProductForm from "./forms/ProductForm";

const resourceName: Record<CatalogResource, string> = {
  products: "Product",
  combos: "সল্যুশন বক্স",
  banners: "ব্যানার",
};

export default function CatalogEditorModal({
  open,
  resource,
  editing,
  value,
  products,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  resource: CatalogResource;
  editing: boolean;
  value: CatalogPayload;
  products: ProductOption[];
  saving: boolean;
  error: string;
  onChange: (value: CatalogPayload) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, saving]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={`${resourceName[resource]} ${editing ? "সম্পাদনা" : "তৈরি"}`}
            className="flex h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-[#f6f9fc] shadow-2xl sm:h-[92vh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 330,
              damping: 30,
              mass: 0.85,
            }}
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ef4277]">
                  {editing ? "তথ্য পরিবর্তন করুন" : "নতুন তথ্য যোগ করুন"}
                </p>
                <h2 className="mt-1 truncate text-xl font-black text-[#062a54] sm:text-2xl">
                  {editing
                    ? `${resourceName[resource]} সম্পাদনা করুন`
                    : `নতুন ${resourceName[resource]} তৈরি করুন`}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  JSON জানার প্রয়োজন নেই—প্রতিটি ঘর সহজভাবে পূরণ করুন।
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                aria-label="মডাল বন্ধ করুন"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
              {error && (
                <div className="mx-auto mb-4 max-w-5xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {error}
                </div>
              )}
              <div className="mx-auto max-w-5xl">
                {resource === "banners" && (
                  <BannerForm
                    value={value as BannerPayload}
                    onChange={onChange}
                  />
                )}
                {resource === "products" && (
                  <ProductForm
                    value={value as ProductPayload}
                    onChange={onChange}
                  />
                )}
                {resource === "combos" && (
                  <ComboForm
                    value={value as ComboPayload}
                    onChange={onChange}
                    products={products}
                  />
                )}
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#ef4277]/20 transition hover:-translate-y-0.5 hover:bg-[#dc3267] disabled:translate-y-0 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? "সংরক্ষণ হচ্ছে..." : "Database-এ সংরক্ষণ করুন"}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
