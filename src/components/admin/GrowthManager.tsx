"use client";

import {
  Activity,
  BellRing,
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
    return { rewarded, pendingReminders, activeAlerts };
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-pink-500">
            Customer lifecycle
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Growth & Retention
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Abandoned cart, product alert, rewards, referral এবং reorder
            automation-এর live summary.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void processNow()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-xs font-black text-white"
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          icon={BellRing}
          label="Pending reminders"
          value={metrics.pendingReminders}
          tone="amber"
        />
        <Metric
          icon={Activity}
          label="Active price/stock alerts"
          value={metrics.activeAlerts}
          tone="emerald"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)]">
          <h2 className="text-lg font-black text-slate-900">
            Recent points history
          </h2>
          <div className="mt-4 overflow-x-auto">
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
          className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)]"
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

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gift;
  label: string;
  value: number;
  tone: "pink" | "sky" | "amber" | "emerald";
}) {
  const colors = {
    pink: "bg-pink-50 text-pink-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)]">
      <span
        className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </article>
  );
}
