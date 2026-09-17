"use client";

import {
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Daily = {
  date: string;
  orders: number;
  delivered: number;
  returned: number;
  cancelled: number;
  revenue: number;
  profit: number;
};
type Expense = {
  id: string;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  note?: string | null;
};
type FinanceData = {
  summary: {
    totalOrders: number;
    deliveredOrders: number;
    returnedOrders: number;
    cancelledOrders: number;
    revenue: number;
    productCost: number;
    packagingCost: number;
    courierCost: number;
    gatewayFee: number;
    otherOrderCost: number;
    grossProfit: number;
    orderNetProfit: number;
    operatingExpense: number;
    actualNetProfit: number;
    profitMargin: number;
  };
  today: {
    orders: number;
    delivered: number;
    returned: number;
    cancelled: number;
  };
  daily: Daily[];
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  expenses: Expense[];
};
const money = (value: number) =>
  `৳ ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
const iso = (date: Date) => date.toISOString().slice(0, 10);

export default function FinanceManager() {
  const [from, setFrom] = useState(() =>
    iso(new Date(Date.now() - 29 * 86_400_000)),
  );
  const [to, setTo] = useState(() => iso(new Date()));
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpense, setShowExpense] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/commerce/finance/summary?from=${from}&to=${to}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message ?? "Finance data load failed");
      setData(body);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Finance data load failed",
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);
  useEffect(() => {
    void load();
  }, [load]);
  async function removeExpense(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`/api/commerce/finance/expenses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  }
  const maxProductProfit = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.topProducts.map((item) => Math.abs(item.profit)) ?? [1]),
      ),
    [data],
  );
  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.17em] text-[#ef4277]">
              Delivered-order accounting
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#062a54]">
              Revenue & Profit/Loss
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              শুধু Delivered order revenue হবে; Return হলে revenue ও profit
              reverse হবে।
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] font-bold text-slate-400">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-xs"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-400">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-xs"
              />
            </label>
            <button
              onClick={() => setShowExpense(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ef4277] px-4 text-xs font-bold text-white"
            >
              <Plus className="size-4" />
              Add expense
            </button>
          </div>
        </div>
      </header>
      {error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      {loading || !data ? (
        <div className="grid h-60 place-items-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="size-7 animate-spin text-[#ef4277]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric
              title="Revenue"
              value={money(data.summary.revenue)}
              icon={<WalletCards />}
            />
            <Metric
              title="Gross profit"
              value={money(data.summary.grossProfit)}
              icon={<TrendingUp />}
            />
            <Metric
              title="Operating expense"
              value={money(data.summary.operatingExpense)}
              icon={<TrendingDown />}
            />
            <Metric
              title="Actual net profit"
              value={money(data.summary.actualNetProfit)}
              note={`${data.summary.profitMargin}% margin`}
              positive={data.summary.actualNetProfit >= 0}
              icon={
                data.summary.actualNetProfit >= 0 ? (
                  <TrendingUp />
                ) : (
                  <TrendingDown />
                )
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Today orders", data.today.orders],
              ["Today delivered", data.today.delivered],
              ["Today returned", data.today.returned],
              ["Today cancelled", data.today.cancelled],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-bold text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#062a54]">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-extrabold text-[#062a54]">
                Revenue vs net profit
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Daily delivered-order performance
              </p>
              <LineChart data={data.daily} />
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-extrabold text-[#062a54]">
                Order status trend
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Orders, delivered, returned and cancelled
              </p>
              <StatusBars data={data.daily} />
            </section>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-extrabold text-[#062a54]">
                Most profitable products / boxes
              </h2>
              <div className="mt-4 space-y-3">
                {data.topProducts.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="truncate font-bold text-slate-700">
                        {item.name} · {item.quantity} sold
                      </span>
                      <span
                        className={
                          item.profit >= 0
                            ? "font-extrabold text-emerald-600"
                            : "font-extrabold text-rose-600"
                        }
                      >
                        {money(item.profit)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.profit >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                        style={{
                          width: `${Math.max(3, (Math.abs(item.profit) / maxProductProfit) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {data.topProducts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    Delivered order হলে profitability দেখা যাবে।
                  </p>
                ) : null}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-extrabold text-[#062a54]">Cost breakdown</h2>
              <div className="mt-3 space-y-2">
                {[
                  ["Product cost", data.summary.productCost],
                  ["Packaging", data.summary.packagingCost],
                  ["Courier", data.summary.courierCost],
                  ["Gateway fee", data.summary.gatewayFee],
                  ["Other order cost", data.summary.otherOrderCost],
                  ["Operating expense", data.summary.operatingExpense],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="text-slate-500">{label}</span>
                    <strong className="text-slate-700">
                      {money(Number(value))}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-extrabold text-[#062a54]">
                Operating expenses
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Date",
                      "Category",
                      "Title",
                      "Note",
                      "Amount",
                      "Action",
                    ].map((item) => (
                      <th key={item} className="px-4 py-3">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.expenses.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        {new Date(item.expenseDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 font-bold">{item.category}</td>
                      <td className="px-4 py-3">{item.title}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {item.note || "—"}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-rose-600">
                        {money(item.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void removeExpense(item.id)}
                          className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {showExpense ? (
        <ExpenseModal
          onClose={() => setShowExpense(false)}
          onSaved={async () => {
            setShowExpense(false);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  positive = true,
  icon,
}: {
  title: string;
  value: string;
  note?: string;
  positive?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`grid size-9 place-items-center rounded-xl ${positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-extrabold text-[#062a54]">{value}</p>
      {note ? (
        <p className="mt-1 text-[10px] font-bold text-slate-400">{note}</p>
      ) : null}
    </div>
  );
}

function LineChart({ data }: { data: Daily[] }) {
  const width = 720,
    height = 230,
    pad = 28;
  const max = Math.max(
    1,
    ...data.flatMap((item) => [item.revenue, Math.max(0, item.profit)]),
  );
  const points = (key: "revenue" | "profit") =>
    data
      .map(
        (item, index) =>
          `${pad + index * ((width - pad * 2) / Math.max(1, data.length - 1))},${height - pad - (Math.max(0, item[key]) / max) * (height - pad * 2)}`,
      )
      .join(" ");
  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 min-w-[620px] w-full"
      >
        <defs>
          <linearGradient id="financeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ef4277" stopOpacity=".18" />
            <stop offset="1" stopColor="#ef4277" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1={pad}
            x2={width - pad}
            y1={pad + (line * (height - pad * 2)) / 4}
            y2={pad + (line * (height - pad * 2)) / 4}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        <polyline
          points={points("revenue")}
          fill="none"
          stroke="#ef4277"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points("profit")}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((item, index) => (
          <text
            key={item.date}
            x={pad + index * ((width - pad * 2) / Math.max(1, data.length - 1))}
            y={height - 5}
            textAnchor="middle"
            fontSize="9"
            fill="#94a3b8"
          >
            {item.date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="flex justify-center gap-5 text-[10px] font-bold text-slate-500">
        <span className="text-[#ef4277]">● Revenue</span>
        <span className="text-emerald-500">● Profit</span>
      </div>
    </div>
  );
}

function StatusBars({ data }: { data: Daily[] }) {
  const max = Math.max(1, ...data.map((item) => item.orders));
  return (
    <div className="mt-4 flex h-56 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-5">
      {data.map((item) => (
        <div
          key={item.date}
          className="flex min-w-10 flex-1 flex-col items-center justify-end gap-1"
        >
          <div className="flex h-44 items-end gap-0.5">
            <span
              title={`Orders ${item.orders}`}
              className="w-2 rounded-t bg-sky-400"
              style={{ height: `${Math.max(3, (item.orders / max) * 100)}%` }}
            />
            <span
              title={`Delivered ${item.delivered}`}
              className="w-2 rounded-t bg-emerald-400"
              style={{
                height: `${Math.max(3, (item.delivered / max) * 100)}%`,
              }}
            />
            <span
              title={`Returned ${item.returned}`}
              className="w-2 rounded-t bg-orange-400"
              style={{ height: `${Math.max(3, (item.returned / max) * 100)}%` }}
            />
            <span
              title={`Cancelled ${item.cancelled}`}
              className="w-2 rounded-t bg-rose-400"
              style={{
                height: `${Math.max(3, (item.cancelled / max) * 100)}%`,
              }}
            />
          </div>
          <span className="text-[9px] text-slate-400">
            {item.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ExpenseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    category: "OTHER",
    title: "",
    amount: 0,
    expenseDate: iso(new Date()),
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Expense save failed");
      await onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Expense save failed",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-extrabold text-[#062a54]">
          Add operating expense
        </h2>
        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-500">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
            >
              {[
                "MARKETING",
                "SALARY",
                "RENT",
                "SOFTWARE",
                "TRANSPORT",
                "UTILITIES",
                "DAMAGE_LOSS",
                "OTHER",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">
            Date
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) =>
                setForm({ ...form, expenseDate: e.target.value })
              }
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-xs font-bold text-slate-500 sm:col-span-2">
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-xs font-bold text-slate-500">
            Amount
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-xs font-bold text-slate-500 sm:col-span-2">
            Note
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="h-11 rounded-xl bg-[#ef4277] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            Save expense
          </button>
        </div>
      </section>
    </div>
  );
}
