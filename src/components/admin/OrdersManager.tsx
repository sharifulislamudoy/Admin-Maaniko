"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  name: string;
  sku?: string | null;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customConfig?: Array<{
    productId: string;
    name?: string;
    quantity: number;
  }> | null;
};

type OrderHistory = {
  id: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "CASH_ON_DELIVERY";
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  area?: string | null;
  city?: string | null;
  note?: string | null;
  alternativePhone?: string | null;
  deliveryType: 0 | 1;
  steadfastConsignmentId?: string | null;
  steadfastTrackingCode?: string | null;
  steadfastStatus?: string | null;
  steadfastSubmittedAt?: string | null;
  steadfastLastSyncedAt?: string | null;
  steadfastError?: string | null;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  history: OrderHistory[];
};

type OrderResponse = {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    counts: Record<"ALL" | OrderStatus, number>;
  };
};

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-orange-100 text-orange-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const EMPTY_COUNTS: Record<"ALL" | OrderStatus, number> = {
  ALL: 0,
  PENDING: 0,
  CONFIRMED: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  CANCELLED: 0,
};

function formatMoney(value: number) {
  return (
    "৳ " +
    new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export default function OrdersManager() {
  const [response, setResponse] = useState<OrderResponse>({
    data: [],
    meta: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      counts: EMPTY_COUNTS,
    },
  });
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) query.set("status", status);
      if (search) query.set("search", search);

      const result = await fetch("/api/commerce/orders?" + query.toString(), {
        cache: "no-store",
      });
      const body = (await result.json()) as OrderResponse & {
        message?: string;
      };

      if (!result.ok) throw new Error(body.message ?? "Order load failed");
      setResponse(body);
      setSelected(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order load failed");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function update(orderId: string, nextStatus: OrderStatus) {
    setBusy(orderId);
    setError("");

    try {
      const result = await fetch(
        "/api/commerce/orders/" + encodeURIComponent(orderId) + "/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
            note:
              nextStatus === "CANCELLED"
                ? "Admin কর্তৃক অর্ডার বাতিল"
                : "Status changed to " + nextStatus,
          }),
        },
      );
      const body = (await result.json()) as { message?: string };
      if (!result.ok) throw new Error(body.message ?? "Update failed");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Update failed");
      await load();
    } finally {
      setBusy("");
    }
  }

  async function syncOne(orderId: string) {
    setBusy(orderId);
    setError("");
    try {
      const result = await fetch(
        `/api/commerce/orders/${encodeURIComponent(orderId)}/steadfast/sync`,
        { method: "POST" },
      );
      const body = (await result.json()) as { message?: string };
      if (!result.ok) throw new Error(body.message ?? "Steadfast sync failed");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Steadfast sync failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function syncAll() {
    setBusy("ALL");
    setError("");
    try {
      const result = await fetch("/api/commerce/orders/steadfast/sync", {
        method: "POST",
      });
      const body = (await result.json()) as { message?: string };
      if (!result.ok) throw new Error(body.message ?? "Steadfast sync failed");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Steadfast sync failed",
      );
    } finally {
      setBusy("");
    }
  }

  const orders = response.data;
  const allSelected =
    orders.length > 0 && orders.every((order) => selected.has(order.id));

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(orders.map((order) => order.id)),
    );
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const firstResult = useMemo(
    () =>
      response.meta.total === 0
        ? 0
        : (response.meta.page - 1) * response.meta.limit + 1,
    [response.meta],
  );
  const lastResult = Math.min(
    response.meta.page * response.meta.limit,
    response.meta.total,
  );

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-black uppercase tracking-[.16em] text-pink-500">
          Commerce
        </p>
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              অর্ডার, customer information এবং delivery status এক জায়গা থেকে
              পরিচালনা করুন।
            </p>
          </div>

          <div className="flex w-full gap-2 lg:max-w-xl">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Invoice, নাম, ফোন বা ঠিকানা..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="Orders refresh করুন"
            >
              <RefreshCcw
                className={"size-4 " + (loading ? "animate-spin" : "")}
              />
            </button>
            <button
              type="button"
              disabled={busy === "ALL"}
              onClick={() => void syncAll()}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#062a54] px-4 text-xs font-black text-white disabled:opacity-50"
            >
              <RefreshCcw
                className={"size-4 " + (busy === "ALL" ? "animate-spin" : "")}
              />
              Steadfast Sync
            </button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {(["", ...STATUSES] as const).map((item) => {
              const active = status === item;
              const label = item ? STATUS_LABEL[item] : "All";
              const count = item
                ? (response.meta.counts[item] ?? 0)
                : (response.meta.counts.ALL ?? 0);

              return (
                <button
                  key={item || "ALL"}
                  type="button"
                  onClick={() => {
                    setStatus(item);
                    setPage(1);
                  }}
                  className={
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-black transition " +
                    (active
                      ? "bg-[#3766ad] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
            Per page
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="m-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-20 grid min-h-56 place-items-center bg-white/75 backdrop-blur-[1px]">
              <Loader2 className="size-7 animate-spin text-[#ef4277]" />
            </div>
          )}

          <table className="w-full min-w-[1530px] border-collapse text-left text-xs">
            <thead className="bg-[#3766ad] text-white">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 accent-pink-500"
                    aria-label="সব order নির্বাচন করুন"
                  />
                </th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Address / Note</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Paid</th>
                <th className="px-3 py-3">Due</th>
                <th className="px-3 py-3">Purchase Method</th>
                <th className="px-3 py-3">Courier</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {orders.map((order, index) => {
                const nextStatuses = NEXT[order.status];
                const isExpanded = expanded === order.id;

                return (
                  <OrderRows
                    key={order.id}
                    order={order}
                    index={index}
                    selected={selected.has(order.id)}
                    isExpanded={isExpanded}
                    nextStatuses={nextStatuses}
                    busy={busy === order.id}
                    onToggle={() => toggleOne(order.id)}
                    onExpand={() => setExpanded(isExpanded ? "" : order.id)}
                    onUpdate={(nextStatus) => void update(order.id, nextStatus)}
                    onSync={() => void syncOne(order.id)}
                  />
                );
              })}

              {!loading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-16 text-center text-sm text-slate-500"
                  >
                    কোনো order পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 p-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {response.meta.total
              ? "Showing " +
                firstResult +
                "–" +
                lastResult +
                " of " +
                response.meta.total
              : "No orders"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-20 text-center font-bold text-slate-700">
              {response.meta.page} / {response.meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= response.meta.totalPages || loading}
              onClick={() =>
                setPage((current) =>
                  Math.min(response.meta.totalPages, current + 1),
                )
              }
              className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function OrderRows({
  order,
  index,
  selected,
  isExpanded,
  nextStatuses,
  busy,
  onToggle,
  onExpand,
  onUpdate,
  onSync,
}: {
  order: Order;
  index: number;
  selected: boolean;
  isExpanded: boolean;
  nextStatuses: OrderStatus[];
  busy: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onUpdate: (status: OrderStatus) => void;
  onSync: () => void;
}) {
  return (
    <>
      <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
        <td className="px-3 py-3 align-top">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-4 accent-pink-500"
            aria-label={order.orderNumber + " নির্বাচন করুন"}
          />
        </td>

        <td className="px-3 py-3 align-top">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExpand}
              className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700"
              aria-label="Order details দেখুন"
            >
              <Eye className="size-4" />
            </button>

            <label className="relative">
              <select
                value=""
                disabled={busy || nextStatuses.length === 0}
                onChange={(event) => {
                  if (event.target.value) {
                    onUpdate(event.target.value as OrderStatus);
                  }
                }}
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 font-bold text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                aria-label="Order status পরিবর্তন করুন"
              >
                <option value="">{busy ? "Updating..." : "Action"}</option>
                {nextStatuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>
                    {nextStatus === "CONFIRMED"
                      ? "Confirm & send to Steadfast"
                      : order.status === "CONFIRMED" &&
                          nextStatus === "PROCESSING"
                        ? "Retry Steadfast dispatch"
                        : `Mark ${STATUS_LABEL[nextStatus]}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          </div>
        </td>

        <td className="px-3 py-3 align-top">
          <button
            type="button"
            onClick={onExpand}
            className="font-black text-[#062a54] hover:text-[#ef4277]"
          >
            {order.orderNumber}
          </button>
        </td>

        <td className="whitespace-nowrap px-3 py-3 align-top text-slate-600">
          {formatDate(order.createdAt)}
        </td>

        <td className="min-w-52 px-3 py-3 align-top">
          <p className="font-black text-slate-900">{order.customerName}</p>
          {order.email && (
            <p className="mt-0.5 text-[11px] text-slate-500">{order.email}</p>
          )}
          <a
            href={"tel:" + order.phone}
            className="mt-0.5 block font-black text-[#3766ad]"
          >
            {order.phone}
          </a>
        </td>

        <td className="max-w-64 px-3 py-3 align-top text-slate-600">
          <p className="line-clamp-2">
            {[order.address, order.area, order.city].filter(Boolean).join(", ")}
          </p>
          {order.note && (
            <p className="mt-1 line-clamp-2 text-[11px] text-amber-700">
              Note: {order.note}
            </p>
          )}
        </td>

        <td className="whitespace-nowrap px-3 py-3 align-top font-black text-slate-900">
          {formatMoney(order.total)}
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-top text-emerald-700">
          {formatMoney(0)}
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-top font-bold text-rose-700">
          {formatMoney(order.total)}
        </td>

        <td className="px-3 py-3 align-top">
          <p className="font-bold text-slate-700">COD</p>
          <span className="mt-1 inline-flex rounded bg-indigo-100 px-2 py-1 text-[10px] font-black text-indigo-700">
            HOME DELIVERY
          </span>
        </td>

        <td className="min-w-44 px-3 py-3 align-top">
          {order.steadfastStatus ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded bg-violet-100 px-2 py-1 text-[10px] font-black text-violet-700">
                  {order.steadfastStatus}
                </span>
                {order.status !== "DELIVERED" &&
                  order.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={onSync}
                      disabled={busy}
                      className="grid size-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      title="Steadfast status sync করুন"
                    >
                      <RefreshCcw
                        className={"size-3.5 " + (busy ? "animate-spin" : "")}
                      />
                    </button>
                  )}
              </div>
              {order.steadfastTrackingCode && (
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  {order.steadfastTrackingCode}
                </p>
              )}
            </>
          ) : (
            <span className="text-[11px] text-slate-400">Not submitted</span>
          )}
          {order.steadfastError && (
            <p className="mt-1 max-w-44 text-[10px] text-rose-600">
              {order.steadfastError}
            </p>
          )}
        </td>

        <td className="px-3 py-3 align-top">
          <span
            className={
              "inline-flex rounded-md px-2 py-1 text-[10px] font-black " +
              STATUS_COLOR[order.status]
            }
          >
            {STATUS_LABEL[order.status]}
          </span>
          {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <span className="mt-1 block w-fit rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-white">
              Due
            </span>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-[#f8fbff]">
          <td colSpan={12} className="p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div>
                <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 p-3 text-[11px] text-slate-600">
                  <p className="font-black text-violet-800">
                    Steadfast delivery
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <span>
                      Delivery:{" "}
                      {order.deliveryType === 1 ? "Hub pickup" : "Home"}
                    </span>
                    <span>Alt phone: {order.alternativePhone || "—"}</span>
                    <span>
                      Consignment: {order.steadfastConsignmentId || "—"}
                    </span>
                    <span>Tracking: {order.steadfastTrackingCode || "—"}</span>
                  </div>
                </div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Order items
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {order.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt=""
                            className="size-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                            No image
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-black text-slate-800">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {item.quantity} × {formatMoney(item.unitPrice)} ={" "}
                            {formatMoney(item.lineTotal)}
                          </p>
                        </div>
                      </div>

                      {Array.isArray(item.customConfig) &&
                        item.customConfig.length > 0 && (
                          <div className="mt-2 border-t border-slate-100 pt-2">
                            {item.customConfig.map((component) => (
                              <p
                                key={component.productId}
                                className="text-[10px] text-slate-500"
                              >
                                {component.name ?? component.productId} ×{" "}
                                {component.quantity}
                              </p>
                            ))}
                          </div>
                        )}
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Status history
                </p>
                <div className="space-y-2">
                  {order.history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            "rounded-md px-2 py-1 text-[10px] font-black " +
                            STATUS_COLOR[item.status]
                          }
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                        <time className="text-[10px] text-slate-400">
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                      {item.note && (
                        <p className="mt-2 text-[11px] text-slate-600">
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
