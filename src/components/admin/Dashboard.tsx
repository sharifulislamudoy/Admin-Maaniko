"use client";

import { Boxes, CircleDollarSign, ShoppingBag, Users } from "lucide-react";
import { useAdminText } from "@/context/AdminTextContext";

const cards = [
  {
    key: "revenue",
    value: "৳2,48,560",
    icon: CircleDollarSign,
    color: "bg-[#ef4277]/10 text-[#ef4277]",
  },
  {
    key: "orders",
    value: "1,248",
    icon: ShoppingBag,
    color: "bg-[#10a9e8]/10 text-[#10a9e8]",
  },
  {
    key: "products",
    value: "386",
    icon: Boxes,
    color: "bg-[#062a54]/10 text-[#062a54]",
  },
  {
    key: "customers",
    value: "3,692",
    icon: Users,
    color: "bg-emerald-100 text-emerald-600",
  },
] as const;

const orders = [
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
];

export default function Dashboard({ name }: { name: string }) {
  const { t } = useAdminText();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#10a9e8]">
          {t("admin.dashboard.eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-black text-[#062a54] sm:text-3xl">
          {t("admin.dashboard.welcome", { name })}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.key}
              className="rounded-3xl border border-[#dce3ec] bg-white p-5 shadow-[0_12px_40px_rgba(6,42,84,0.06)]"
            >
              <div
                className={`grid size-12 place-items-center rounded-2xl ${card.color}`}
              >
                <Icon className="size-6" />
              </div>
              <p className="mt-5 text-sm font-bold text-slate-500">
                {t(`admin.dashboard.${card.key}`)}
              </p>
              <p className="mt-1 text-2xl font-black text-[#062a54]">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>
      <section className="overflow-hidden rounded-3xl border border-[#dce3ec] bg-white shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
        <h2 className="border-b border-[#dce3ec] px-5 py-5 text-lg font-black text-[#062a54]">
          {t("admin.dashboard.recentOrders")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">অর্ডার</th>
                <th className="px-6 py-4">ক্রেতা</th>
                <th className="px-6 py-4">মোট</th>
                <th className="px-6 py-4">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 font-black text-[#062a54]">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 font-black text-[#ef4277]">
                    {order.total}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
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
