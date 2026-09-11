"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const money = useMemo(
    () =>
      new Intl.NumberFormat("bn-BD", {
        style: "currency",
        currency: "BDT",
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      }),
    [],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/commerce/orders${status ? `?status=${status}` : ""}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Order load failed");
      setOrders(Array.isArray(body) ? body : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function update(orderId: string, nextStatus: string) {
    setBusy(orderId);
    setError("");
    try {
      const response = await fetch(
        `/api/commerce/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
            note:
              nextStatus === "CANCELLED"
                ? "Admin কর্তৃক অর্ডার বাতিল"
                : `Status changed to ${nextStatus}`,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Update failed");
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? body : order)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-pink-500">
            Commerce
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Order status, customer details এবং customized Solution Box
            configuration manage করুন।
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl bg-slate-50 px-3 text-sm ring-1 ring-[#e8edf3]"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_LABEL).map((key) => (
              <option key={key} value={key}>
                {STATUS_LABEL[key]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"
          >
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] md:p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs text-slate-400">Order</p>
                <h2 className="font-black text-slate-900">
                  {order.orderNumber}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {order.customerName} • {order.phone}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {order.address}
                  {order.area ? `, ${order.area}` : ""}
                  {order.city ? `, ${order.city}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {new Date(order.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>

              <div className="md:text-right">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
                <p className="mt-2 text-xl font-black text-pink-500">
                  {money.format(order.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex gap-2">
                    <img
                      src={item.image ?? ""}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-black text-slate-800">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.quantity} × {money.format(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(item.customConfig) &&
                  item.customConfig.length ? (
                    <details className="mt-2 border-t border-[#eef1f5] pt-2">
                      <summary className="cursor-pointer text-[11px] font-black text-sky-600">
                        Customized Box items
                      </summary>
                      <div className="mt-2 space-y-1">
                        {item.customConfig.map((component: any) => (
                          <p
                            key={component.productId}
                            className="text-[10px] text-slate-500"
                          >
                            {component.name} × {component.quantity}
                          </p>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef1f5] pt-4">
              {(NEXT[order.status] ?? []).map((nextStatus) => (
                <button
                  key={nextStatus}
                  disabled={busy === order.id}
                  onClick={() => void update(order.id, nextStatus)}
                  className={`rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 ${
                    nextStatus === "CANCELLED" ? "bg-red-500" : "bg-slate-900"
                  }`}
                >
                  {nextStatus === "CANCELLED"
                    ? "Cancel order"
                    : `Mark ${STATUS_LABEL[nextStatus]}`}
                </button>
              ))}
            </div>

            <div className="mt-4 flex overflow-x-auto">
              {order.history.map((history: any, index: number) => (
                <div
                  key={history.id}
                  className="flex min-w-[150px] items-start"
                >
                  <span className="mt-1.5 size-2.5 rounded-full bg-pink-500" />
                  <div className="ml-2">
                    <p className="text-[11px] font-black">
                      {STATUS_LABEL[history.status] ?? history.status}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {new Date(history.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  {index < order.history.length - 1 ? (
                    <span className="mx-2 mt-2 h-px min-w-6 flex-1 bg-slate-200" />
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,.04)] py-14 text-center text-sm text-slate-500">
            কোনো order পাওয়া যায়নি।
          </div>
        ) : null}
      </div>
    </div>
  );
}
