"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";

import { useAdminText } from "@/context/AdminTextContext";
import { COLLECTIONS, type AdminResource } from "@/lib/admin-collections";

type AdminCollectionPageProps = {
  resource: AdminResource;
};

const badgeStyles: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function AdminCollectionPage({
  resource,
}: AdminCollectionPageProps) {
  const { t } = useAdminText();
  const collection = COLLECTIONS[resource];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ef4277]">
            {t("admin.common.management")}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#062a54] sm:text-3xl">
            {t(`admin.pages.${resource}.title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {t(`admin.pages.${resource}.subtitle`)}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ef4277] px-5 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(239,66,119,0.24)] transition hover:bg-[#10a9e8] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          {t(`admin.pages.${resource}.add`)}
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#dce3ec] bg-white shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#dce3ec] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">{t("admin.actions.search")}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t("admin.actions.searchPlaceholder")}
              className="h-11 w-full rounded-2xl border border-[#dce3ec] bg-[#f8fafc] pl-11 pr-4 text-sm outline-none transition focus:border-[#10a9e8] focus:bg-white focus:ring-4 focus:ring-[#10a9e8]/10"
            />
          </label>
          <p className="text-sm font-bold text-slate-500">
            {t("admin.common.items", { count: collection.rows.length })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                {collection.columns.map((column) => (
                  <th key={column} className="px-6 py-4">
                    {t(`admin.table.${column}`)}
                  </th>
                ))}
                <th className="px-6 py-4 text-right">
                  {t("admin.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f5]">
              {collection.rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[#fff8fa]"
                >
                  {collection.columns.map((column, index) => {
                    const value = row[column] ?? "—";
                    const isStatus = column === "status";
                    return (
                      <td
                        key={column}
                        className={`px-6 py-4 text-sm ${index === 0 ? "font-black text-[#062a54]" : "font-semibold text-slate-600"}`}
                      >
                        {isStatus ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${badgeStyles[value] ?? badgeStyles.draft}`}
                          >
                            {t(`admin.status.${value}`)}
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      aria-label={t("admin.table.actions")}
                      className="grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-[#fff0f5] hover:text-[#ef4277]"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
