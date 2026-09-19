"use client";

import {
  Activity,
  BellRing,
  CheckCircle2,
  Clock3,
  Gift,
  Play,
  RefreshCcw,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type GrowthData = {
  rewardTotals: { _sum: { points?: number | null }; _count: number };
  referrals: Array<{ status: string; _count: number }>;
  reminders: Array<{ type: string; status: string; _count: number }>;
  leads: Array<{ type: string; isActive: boolean; _count: number }>;
  recentTransactions: Array<{
    id: string;
    points: number;
    description: string;
    createdAt: string;
    customer: { id: string; name?: string | null; phone?: string | null };
    order?: { orderNumber: string } | null;
  }>;
  recentAlerts: Array<{
    id: string;
    type: "PRICE_DROP" | "BACK_IN_STOCK";
    isActive: boolean;
    notifiedAt?: string | null;
    createdAt: string;
    customer?: { id: string; name?: string | null; phone?: string | null } | null;
    product?: { id: string; name: string; sku: string } | null;
    variant?: { id: string; sku: string } | null;
    combo?: { id: string; name: string; sku: string } | null;
  }>;
};

type CustomerOption = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

export default function GrowthManager() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [growthResponse, customerResponse] = await Promise.all([
        fetch("/api/commerce/growth", { cache: "no-store" }),
        fetch("/api/commerce/customers", { cache: "no-store" }),
      ]);
      const [growthBody, customerBody] = await Promise.all([
        growthResponse.json(),
        customerResponse.json(),
      ]);
      if (!growthResponse.ok)
        throw new Error(growthBody.message ?? "Growth data load failed");
      if (!customerResponse.ok)
        throw new Error(customerBody.message ?? "Customers load failed");
      setData(growthBody);
      setCustomers(Array.isArray(customerBody) ? customerBody : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const metrics = useMemo(() => {
    const rewarded =
      data?.referrals.find((item) => item.status === "REWARDED")?._count ?? 0;
    const pendingReferrals =
      data?.referrals.find((item) => item.status === "PENDING")?._count ?? 0;
    const pendingReminders =
      data?.reminders
        .filter((item) => item.status === "PENDING")
        .reduce((sum, item) => sum + item._count, 0) ?? 0;
    const activeAlerts =
      data?.leads
        .filter(
          (item) =>
            item.isActive &&
            ["PRICE_DROP", "BACK_IN_STOCK"].includes(item.type),
        )
        .reduce((sum, item) => sum + item._count, 0) ?? 0;
    return { rewarded, pendingReferrals, pendingReminders, activeAlerts };
  }, [data]);

  async function processNow() {
    setLoading(true);
    try {
      const response = await fetch("/api/commerce/growth/process", {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Process failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Process failed");
      setLoading(false);
    }
  }

  async function adjust(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/growth/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, points: Number(points), reason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Adjustment failed");
      setPoints("");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-pink-500">
            Customer lifecycle
          </p>
          <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
            Growth & Retention
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Abandoned cart, product alert, rewards, referral এবং reorder
            automation-এর live summary.
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 sm:flex sm:justify-start">
          <button
            onClick={() => void processNow()}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-pink-500 px-3 text-xs font-black text-white sm:px-4"
          >
            <Play className="size-4" />
            Run automation
          </button>
          <button
            onClick={() => void load()}
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"
          >
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>
      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <Metric
          icon={Gift}
          label="Points transactions"
          value={data?.rewardTotals._count ?? 0}
          tone="pink"
        />
        <Metric
          icon={UsersRound}
          label="Successful referrals"
          value={metrics.rewarded}
          tone="sky"
        />
        <Metric
          icon={Clock3}
          label="Pending referrals"
          value={metrics.pendingReferrals}
          tone="amber"
        />
        <Metric
          icon={BellRing}
          label="Pending reminders"
          value={metrics.pendingReminders}
          tone="violet"
        />
        <Metric
          icon={Activity}
          label="Active price/stock alerts"
          value={metrics.activeAlerts}
          tone="emerald"
        />
      </section>

      <section className="min-w-0 rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Product alert customers</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              কোন customer কোন product-এর stock বা price update-এর অপেক্ষায় আছেন।
            </p>
          </div>
          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600">
            {(data?.recentAlerts ?? []).filter((item) => item.isActive).length} active
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:hidden">
          {(data?.recentAlerts ?? []).map((item) => (
            <AlertCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="uppercase text-slate-400">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Product / variant</th>
                <th className="pb-3">Alert</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentAlerts ?? []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-3"><p className="font-black text-slate-800">{item.customer?.name ?? "—"}</p><p className="text-slate-400">{item.customer?.phone ?? "—"}</p></td>
                  <td className="py-3"><p className="font-bold text-slate-700">{item.product?.name ?? item.combo?.name ?? "Deleted product"}</p><p className="text-slate-400">{item.variant?.sku ?? item.product?.sku ?? item.combo?.sku ?? "—"}</p></td>
                  <td className="py-3 font-bold">{item.type === "PRICE_DROP" ? "Price drop" : "Back in stock"}</td>
                  <td className="py-3"><span className={`rounded-full px-2 py-1 font-black ${item.isActive ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.isActive ? "WAITING" : "NOTIFIED"}</span></td>
                  <td className="py-3 text-slate-500">{new Date(item.createdAt).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.recentAlerts.length ? <p className="py-8 text-center text-sm text-slate-400">No product alerts yet.</p> : null}
      </section>

      <section className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:grid-cols-3 sm:p-5">
        <div className="sm:col-span-3">
          <h2 className="text-sm font-black text-slate-900">
            Referral success flow
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Code apply করলেই referral successful হয় না। Referred customer-এর
            প্রথম order Delivered হলে automation দুজনকে points দিয়ে status
            REWARDED করে।
          </p>
        </div>
        <FlowStep
          icon={UsersRound}
          title="Code applied"
          text="Status: PENDING"
        />
        <FlowStep
          icon={BellRing}
          title="First order delivered"
          text="Admin order status Delivered করবেন"
        />
        <FlowStep
          icon={CheckCircle2}
          title="Reward completed"
          text="দুজনের wallet-এ referral points যোগ হবে"
        />
      </section>

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5">
          <h2 className="text-lg font-black text-slate-900">
            Recent points history
          </h2>
          <div className="mt-4 space-y-3 md:hidden">
            {data?.recentTransactions.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-100 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {item.customer.name ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.customer.phone || "No phone"}
                    </p>
                  </div>
                  <strong
                    className={
                      item.points >= 0 ? "text-emerald-600" : "text-red-500"
                    }
                  >
                    {item.points >= 0 ? "+" : ""}
                    {item.points}
                  </strong>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  <span>{item.order?.orderNumber ?? "No order"}</span>
                  <span>
                    {new Date(item.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>
              </article>
            ))}
            {!data?.recentTransactions.length ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No point transactions yet.
              </p>
            ) : null}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Points</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <p className="font-black">{item.customer.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">
                        {item.customer.phone}
                      </p>
                    </td>
                    <td className="py-3 text-xs text-slate-600">
                      {item.description}
                    </td>
                    <td className="py-3 text-xs font-bold">
                      {item.order?.orderNumber ?? "—"}
                    </td>
                    <td
                      className={`py-3 font-black ${item.points >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {item.points >= 0 ? "+" : ""}
                      {item.points}
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <form
          onSubmit={adjust}
          className="min-w-0 rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5"
        >
          <h2 className="text-lg font-black text-slate-900">
            Manual point adjustment
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Positive number adds points; negative number deducts them. Every
            change is recorded.
          </p>
          <label className="mt-5 block text-xs font-black text-slate-700">
            Customer
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name ?? "Unnamed"} — {customer.phone}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-xs font-black text-slate-700">
            Points
            <input
              required
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 50 or -20"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
          <label className="mt-4 block text-xs font-black text-slate-700">
            Reason
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
          </label>
          <button
            disabled={saving}
            className="mt-4 h-11 w-full rounded-xl bg-slate-900 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save adjustment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AlertCard({ item }: { item: GrowthData["recentAlerts"][number] }) {
  return (
    <article className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{item.product?.name ?? item.combo?.name ?? "Deleted product"}</p><p className="mt-0.5 text-xs text-slate-400">{item.variant?.sku ?? item.product?.sku ?? item.combo?.sku ?? "—"}</p></div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${item.isActive ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.isActive ? "WAITING" : "NOTIFIED"}</span>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-700">{item.customer?.name ?? "—"} • {item.customer?.phone ?? "—"}</p>
      <p className="mt-1 text-xs text-slate-500">{item.type === "PRICE_DROP" ? "Price drop" : "Back in stock"}</p>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gift;
  label: string;
  value: number;
  tone: "pink" | "sky" | "amber" | "emerald" | "violet";
}) {
  const colors = {
    pink: "bg-pink-50 text-pink-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <article className="min-w-0 rounded-2xl bg-white p-3.5 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5">
      <span
        className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-xl font-black text-slate-900 sm:mt-4 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </article>
  );
}

function FlowStep({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Gift;
  title: string;
  text: string;
}) {
  return (
    <article className="flex min-w-0 items-start gap-3 rounded-xl bg-white p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-900">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{text}</p>
      </div>
    </article>
  );
}
