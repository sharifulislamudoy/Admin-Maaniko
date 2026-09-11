"use client";

import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { useAdminText } from "@/context/AdminTextContext";

const recentOrders = [
  {
    id: "MN-1048",
    customer: "Sadia Rahman",
    total: "৳4,850",
    status: "processing",
  },
  {
    id: "MN-1047",
    customer: "Nusrat Jahan",
    total: "৳2,990",
    status: "delivered",
  },
  {
    id: "MN-1046",
    customer: "Raisa Ahmed",
    total: "৳1,650",
    status: "pending",
  },
  {
    id: "MN-1045",
    customer: "Tahmina Akter",
    total: "৳3,420",
    status: "cancelled",
  },
];

const statusClasses: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function DashboardPage() {
  const { t } = useAdminText();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.revenue")}
          value="৳2,48,560"
          change={t("admin.dashboard.upFromLastMonth", { value: "12.5%" })}
          icon={CircleDollarSign}
          accent="pink"
        />
        <StatCard
          label={t("admin.dashboard.orders")}
          value="1,248"
          change={t("admin.dashboard.upFromLastMonth", { value: "8.2%" })}
          icon={ShoppingBag}
          accent="blue"
        />
        <StatCard
          label={t("admin.dashboard.products")}
          value="386"
          change={t("admin.dashboard.lowStock", { value: "14" })}
          icon={Boxes}
          accent="navy"
        />
        <StatCard
          label={t("admin.dashboard.customers")}
          value="3,692"
          change={t("admin.dashboard.newCustomers", { value: "96" })}
          icon={Users}
          accent="green"
        />
      </section>

      <section className="rounded-3xl border border-[#dce3ec] bg-white shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#dce3ec] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-black text-[#062a54]">
              {t("admin.dashboard.recentOrders")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("admin.dashboard.recentOrdersSubtitle")}
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#ef4277] transition-colors hover:text-[#10a9e8]"
          >
            <span className="hidden sm:inline">
              {t("admin.common.viewAll")}
            </span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-6 py-4">{t("admin.table.orderId")}</th>
                <th className="px-6 py-4">{t("admin.table.customer")}</th>
                <th className="px-6 py-4">{t("admin.table.total")}</th>
                <th className="px-6 py-4">{t("admin.table.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f5]">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-[#fff8fa]"
                >
                  <td className="px-6 py-4 text-sm font-black text-[#062a54]">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-[#ef4277]">
                    {order.total}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${statusClasses[order.status]}`}
                    >
                      {t(`admin.status.${order.status}`)}
                    </span>
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
