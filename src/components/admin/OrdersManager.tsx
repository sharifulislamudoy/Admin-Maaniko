"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Printer,
  RefreshCcw,
  Search,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import InvoicePrintArea from "@/components/admin/InvoicePrintArea";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  name: string;
  sku?: string | null;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  purchaseCostSnapshot?: number;
  packagingCostSnapshot?: number;
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

export type Order = {
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
  revenue?: number;
  productCost?: number;
  packagingCost?: number;
  courierCost?: number;
  gatewayFee?: number;
  otherCost?: number;
  totalCost?: number;
  grossProfit?: number;
  netProfit?: number;
  profitMargin?: number;
  financialRecognized?: boolean;

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
  "RETURNED",
  "CANCELLED",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-pink-200 bg-pink-50 text-pink-700",
  PROCESSING: "border-orange-200 bg-orange-50 text-orange-700",
  SHIPPED: "border-violet-200 bg-violet-50 text-violet-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RETURNED: "border-orange-200 bg-orange-50 text-orange-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

const EMPTY_COUNTS: Record<"ALL" | OrderStatus, number> = {
  ALL: 0,
  PENDING: 0,
  CONFIRMED: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  RETURNED: 0,
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
  const [printingOrders, setPrintingOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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

      if (status) {
        query.set("status", status);
      }

      if (search) {
        query.set("search", search);
      }

      const result = await fetch("/api/commerce/orders?" + query.toString(), {
        cache: "no-store",
      });

      const body = (await result.json()) as OrderResponse & {
        message?: string;
      };

      if (!result.ok) {
        throw new Error(body.message ?? "Order load failed");
      }

      setResponse(body);
      setSelected(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order load failed");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function update(
    orderId: string,
    nextStatus: OrderStatus,
    manual = false,
  ) {
    setBusy(orderId);
    setError("");

    try {
      const result = await fetch(
        "/api/commerce/orders/" +
          encodeURIComponent(orderId) +
          (manual ? "/manual-status" : "/status"),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
            note: manual
              ? "Steadfast API fallback: Admin manually changed status to " +
                nextStatus
              : nextStatus === "CANCELLED"
                ? "Admin কর্তৃক অর্ডার বাতিল"
                : "Status changed to " + nextStatus,
          }),
        },
      );

      const body = (await result.json()) as {
        message?: string;
      };

      if (!result.ok) {
        throw new Error(body.message ?? "Update failed");
      }

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
        {
          method: "POST",
        },
      );

      const body = (await result.json()) as {
        message?: string;
      };

      if (!result.ok) {
        throw new Error(body.message ?? "Steadfast sync failed");
      }

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

      const body = (await result.json()) as {
        message?: string;
      };

      if (!result.ok) {
        throw new Error(body.message ?? "Steadfast sync failed");
      }

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

  const selectedOrders = useMemo(
    () => orders.filter((order) => selected.has(order.id)),
    [orders, selected],
  );

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

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

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
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-[0_5px_22px_rgba(15,23,42,0.04)]">
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4277] via-[#ff789e] to-[#ffd2de]" />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ef4277]" />

                <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#ef4277]">
                  Commerce
                </p>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#062a54]">
                Orders
              </h1>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                অর্ডার, customer information এবং delivery status এক জায়গা থেকে
                পরিচালনা করুন।
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-2xl">
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Invoice, নাম, ফোন বা ঠিকানা..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-pink-200 focus:border-[#ef4277] focus:bg-white focus:ring-4 focus:ring-pink-50"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-pink-200 hover:bg-pink-50 hover:text-[#ef4277]"
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
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#062a54] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0a386d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw
                    className={
                      "size-4 " + (busy === "ALL" ? "animate-spin" : "")
                    }
                  />

                  <span className="whitespace-nowrap">Steadfast Sync</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Order table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_22px_rgba(15,23,42,0.04)]">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
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
                    "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition " +
                    (active
                      ? "border-[#ef4277] bg-[#ef4277] text-white shadow-[0_3px_10px_rgba(239,66,119,0.18)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50 hover:text-[#ef4277]")
                  }
                >
                  {label}

                  <span
                    className={
                      "rounded-md px-1.5 py-0.5 text-[9px] " +
                      (active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500")
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedOrders.length === 0}
              onClick={() => setPrintingOrders(selectedOrders)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4277] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d93870] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Printer className="size-3.5" />
              Print selected
              {selectedOrders.length > 0 && (
                <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px]">
                  {selectedOrders.length}
                </span>
              )}
            </button>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              Per page
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#ef4277] focus:ring-2 focus:ring-pink-50"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="m-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Table */}
        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-20 grid min-h-56 place-items-center bg-white/80 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-7 animate-spin text-[#ef4277]" />

                <span className="text-xs font-semibold text-slate-500">
                  Orders loading...
                </span>
              </div>
            </div>
          )}

          <table className="w-full min-w-[1370px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#ef4277]/15 bg-[#fff4f6] text-[#062a54]">
                <th className="w-10 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer accent-[#ef4277]"
                    aria-label="সব order নির্বাচন করুন"
                  />
                </th>

                <th className="w-[142px] px-2 py-3.5">Action</th>

                <th className="whitespace-nowrap px-3 py-3.5">Invoice</th>

                <th className="whitespace-nowrap px-3 py-3.5">Date</th>

                <th className="px-3 py-3.5">Customer</th>

                <th className="px-3 py-3.5">Address / Note</th>

                <th className="whitespace-nowrap px-3 py-3.5">Total</th>

                <th className="whitespace-nowrap px-3 py-3.5">Paid</th>

                <th className="whitespace-nowrap px-3 py-3.5">Due</th>

                <th className="whitespace-nowrap px-3 py-3.5">
                  Purchase Method
                </th>

                <th className="px-3 py-3.5">Courier</th>

                <th className="px-3 py-3.5">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
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
                    onUpdate={(nextStatus, manual) =>
                      void update(order.id, nextStatus, manual)
                    }
                    onSync={() => void syncOne(order.id)}
                    onPrint={() => setPrintingOrders([order])}
                    onEdit={() => setEditingOrder(order)}
                  />
                );
              })}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-pink-50 text-[#ef4277]">
                        <Search className="size-5" />
                      </div>

                      <p className="font-bold text-slate-700">
                        কোনো order পাওয়া যায়নি
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Search অথবা status filter পরিবর্তন করে আবার চেষ্টা করুন।
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 p-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {response.meta.total
              ? `Showing ${firstResult}–${lastResult} of ${response.meta.total}`
              : "No orders"}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-[#ef4277] disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="min-w-[84px] rounded-lg bg-white px-3 py-2 text-center font-bold text-[#062a54]">
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
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-[#ef4277] disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      </section>

      <InvoicePrintArea
        orders={printingOrders}
        onAfterPrint={() => setPrintingOrders([])}
      />
      {editingOrder ? (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={async () => {
            setEditingOrder(null);
            await load();
          }}
        />
      ) : null}
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
  onPrint,
  onEdit,
}: {
  order: Order;
  index: number;
  selected: boolean;
  isExpanded: boolean;
  nextStatuses: OrderStatus[];
  busy: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onUpdate: (status: OrderStatus, manual?: boolean) => void;
  onSync: () => void;
  onPrint: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <tr
        className={
          "transition-colors hover:bg-pink-50/30 " +
          (selected
            ? "bg-pink-50/60"
            : index % 2 === 0
              ? "bg-white"
              : "bg-slate-50/35")
        }
      >
        {/* Select */}
        <td className="px-3 py-3 align-top">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-4 cursor-pointer accent-[#ef4277]"
            aria-label={order.orderNumber + " নির্বাচন করুন"}
          />
        </td>

        {/* Compact action */}
        <td className="w-[142px] px-2 py-3 align-top">
          <div className="flex w-[126px] items-center gap-1.5">
            <button
              type="button"
              onClick={onExpand}
              className={
                "grid size-8 shrink-0 place-items-center rounded-lg border transition " +
                (isExpanded
                  ? "border-[#ef4277] bg-[#ef4277] text-white"
                  : "border-pink-100 bg-pink-50 text-[#ef4277] hover:border-[#ef4277] hover:bg-[#ef4277] hover:text-white")
              }
              aria-label="Order details দেখুন"
              title="Order details"
            >
              <Eye className="size-3.5" />
            </button>

            <label className="relative min-w-0 flex-1">
              <select
                value=""
                disabled={busy || nextStatuses.length === 0}
                onChange={(event) => {
                  if (event.target.value) {
                    const manual = event.target.value.startsWith("MANUAL:");
                    onUpdate(
                      event.target.value.replace("MANUAL:", "") as OrderStatus,
                      manual,
                    );
                  }
                }}
                className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2 pr-6 text-[10px] font-bold text-slate-600 outline-none transition hover:border-pink-200 focus:border-[#ef4277] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                aria-label="Order status পরিবর্তন করুন"
              >
                <option value="">
                  {busy
                    ? "Updating..."
                    : nextStatuses.length === 0
                      ? "Done"
                      : "Action"}
                </option>

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

                {order.status === "PENDING" ? (
                  <option value="MANUAL:CONFIRMED">
                    Mark Confirmed manually
                  </option>
                ) : null}

                {order.status === "CONFIRMED" ? (
                  <option value="MANUAL:PROCESSING">
                    Mark Processing manually
                  </option>
                ) : null}
              </select>

              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
            </label>
          </div>
        </td>

        {/* Invoice */}
        <td className="px-3 py-3 align-top">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExpand}
              className="whitespace-nowrap font-extrabold text-[#062a54] transition hover:text-[#ef4277]"
            >
              {order.orderNumber}
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="grid size-7 shrink-0 place-items-center rounded-md border border-pink-100 bg-pink-50 text-[#ef4277] transition hover:border-[#ef4277] hover:bg-[#ef4277] hover:text-white"
              aria-label={`${order.orderNumber} invoice print করুন`}
              title="Print invoice"
            >
              <Printer className="size-3.5" />
            </button>
          </div>
        </td>

        {/* Date */}
        <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] text-slate-500">
          {formatDate(order.createdAt)}
        </td>

        {/* Customer */}
        <td className="min-w-[180px] px-3 py-3 align-top">
          <p className="font-bold text-slate-800">{order.customerName}</p>

          {order.email && (
            <p className="mt-0.5 max-w-[190px] truncate text-[10px] text-slate-400">
              {order.email}
            </p>
          )}

          <a
            href={"tel:" + order.phone}
            className="mt-1 block w-fit text-[11px] font-bold text-[#ef4277] transition hover:text-[#062a54]"
          >
            {order.phone}
          </a>
        </td>

        {/* Address */}
        <td className="max-w-[240px] px-3 py-3 align-top text-[11px] leading-5 text-slate-500">
          <p className="line-clamp-2">
            {[order.address, order.area, order.city].filter(Boolean).join(", ")}
          </p>

          {order.note && (
            <p className="mt-1.5 line-clamp-2 rounded-md bg-amber-50 px-2 py-1 text-[10px] leading-4 text-amber-700">
              <span className="font-bold">Note:</span> {order.note}
            </p>
          )}
        </td>

        {/* Total */}
        <td className="whitespace-nowrap px-3 py-3 align-top font-extrabold text-[#062a54]">
          {formatMoney(order.total)}
        </td>

        {/* Paid */}
        <td className="whitespace-nowrap px-3 py-3 align-top font-semibold text-emerald-600">
          {formatMoney(0)}
        </td>

        {/* Due */}
        <td className="whitespace-nowrap px-3 py-3 align-top font-bold text-rose-600">
          {formatMoney(order.total)}
        </td>

        {/* Payment */}
        <td className="px-3 py-3 align-top">
          <p className="font-bold text-slate-700">COD</p>

          <span className="mt-1 inline-flex whitespace-nowrap rounded-md border border-pink-100 bg-pink-50 px-2 py-1 text-[9px] font-bold text-[#ef4277]">
            HOME DELIVERY
          </span>
        </td>

        {/* Courier */}
        <td className="min-w-[150px] px-3 py-3 align-top">
          {order.steadfastStatus ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase text-violet-700">
                  {order.steadfastStatus}
                </span>

                {order.status !== "DELIVERED" &&
                  order.status !== "RETURNED" &&
                  order.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={onSync}
                      disabled={busy}
                      className="grid size-7 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-pink-200 hover:bg-pink-50 hover:text-[#ef4277] disabled:opacity-40"
                      title="Steadfast status sync করুন"
                    >
                      <RefreshCcw
                        className={"size-3 " + (busy ? "animate-spin" : "")}
                      />
                    </button>
                  )}
              </div>

              {order.steadfastTrackingCode && (
                <p className="mt-1.5 max-w-[145px] truncate font-mono text-[9px] text-slate-400">
                  {order.steadfastTrackingCode}
                </p>
              )}
            </>
          ) : (
            <span className="text-[10px] font-medium text-slate-400">
              Not submitted
            </span>
          )}

          {order.steadfastError && (
            <p className="mt-1 max-w-[150px] line-clamp-2 text-[9px] leading-4 text-rose-600">
              {order.steadfastError}
            </p>
          )}
        </td>

        {/* Status */}
        <td className="px-3 py-3 align-top">
          <span
            className={
              "inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[9px] font-extrabold " +
              STATUS_COLOR[order.status]
            }
          >
            {STATUS_LABEL[order.status]}
          </span>

          {order.status !== "DELIVERED" &&
            order.status !== "RETURNED" &&
            order.status !== "CANCELLED" && (
              <span className="mt-1.5 block w-fit rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600">
                Due
              </span>
            )}
        </td>
      </tr>

      {/* Expanded details */}
      {isExpanded && (
        <tr className="bg-[#fffafb]">
          <td colSpan={12} className="border-y border-pink-100 p-4">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              {/* Left */}
              <div className="min-w-0">
                {/* Steadfast */}
                <div className="mb-4 overflow-hidden rounded-xl border border-pink-100 bg-white">
                  <div className="flex items-center justify-between border-b border-pink-100 bg-[#fff4f6] px-3 py-2.5">
                    <p className="text-xs font-extrabold text-[#062a54]">
                      Steadfast delivery
                    </p>

                    <div className="flex items-center gap-2">
                      {order.status !== "DELIVERED" &&
                      order.status !== "RETURNED" &&
                      order.status !== "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={onEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#ef4277] transition hover:bg-pink-50"
                        >
                          <Pencil className="size-3" /> Edit order
                        </button>
                      ) : null}
                      {order.steadfastStatus && (
                        <span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-[#ef4277] shadow-sm">
                          {order.steadfastStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-2 p-3 text-[11px] text-slate-500 sm:grid-cols-2">
                    <DetailValue
                      label="Delivery"
                      value={
                        order.deliveryType === 1
                          ? "Hub pickup"
                          : "Home delivery"
                      }
                    />

                    <DetailValue
                      label="Alternative phone"
                      value={order.alternativePhone || "—"}
                    />

                    <DetailValue
                      label="Consignment"
                      value={order.steadfastConsignmentId || "—"}
                    />

                    <DetailValue
                      label="Tracking"
                      value={order.steadfastTrackingCode || "—"}
                    />
                  </div>
                </div>

                {/* Order items */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-[#ef4277]" />

                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#062a54]">
                    Order items
                  </p>

                  <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[9px] font-bold text-[#ef4277]">
                    {order.items.length}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                  {order.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-pink-200 hover:shadow-sm"
                    >
                      <div className="flex gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt=""
                            className="size-12 shrink-0 rounded-lg border border-slate-100 object-cover"
                          />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-50 text-center text-[9px] text-slate-400">
                            No image
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[11px] font-bold leading-4 text-slate-800">
                            {item.name}
                          </p>

                          {item.sku && (
                            <p className="mt-0.5 truncate text-[9px] text-slate-400">
                              SKU: {item.sku}
                            </p>
                          )}

                          <p className="mt-1 text-[10px] font-medium text-slate-500">
                            {item.quantity} × {formatMoney(item.unitPrice)}
                          </p>

                          <p className="mt-0.5 text-[10px] font-bold text-[#062a54]">
                            {formatMoney(item.lineTotal)}
                          </p>
                        </div>
                      </div>

                      {Array.isArray(item.customConfig) &&
                        item.customConfig.length > 0 && (
                          <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5">
                            {item.customConfig.map((component) => (
                              <div
                                key={component.productId}
                                className="flex items-center justify-between gap-2 text-[9px] text-slate-500"
                              >
                                <span className="truncate">
                                  {component.name ?? component.productId}
                                </span>

                                <span className="shrink-0 rounded bg-slate-50 px-1.5 py-0.5 font-bold">
                                  × {component.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </article>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-3 flex justify-end">
                  <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between py-1 text-[11px] text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-700">
                        {formatMoney(order.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 text-[11px] text-slate-500">
                      <span>Delivery charge</span>
                      <span className="font-semibold text-slate-700">
                        {formatMoney(order.deliveryCharge)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs font-extrabold text-[#062a54]">
                        Total
                      </span>

                      <span className="text-sm font-extrabold text-[#ef4277]">
                        {formatMoney(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
                {order.financialRecognized ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <DetailValue
                      label="Revenue"
                      value={formatMoney(order.revenue ?? 0)}
                    />
                    <DetailValue
                      label="Total cost"
                      value={formatMoney(order.totalCost ?? 0)}
                    />
                    <DetailValue
                      label="Actual profit"
                      value={formatMoney(order.netProfit ?? 0)}
                    />
                  </div>
                ) : null}
              </div>

              {/* History */}
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-[#ef4277]" />

                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#062a54]">
                    Status history
                  </p>
                </div>

                <div className="relative space-y-2">
                  {order.history.map((item, historyIndex) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-pink-50 text-[9px] font-extrabold text-[#ef4277]">
                            {historyIndex + 1}
                          </span>

                          <span
                            className={
                              "rounded-md border px-2 py-1 text-[9px] font-extrabold " +
                              STATUS_COLOR[item.status]
                            }
                          >
                            {STATUS_LABEL[item.status]}
                          </span>
                        </div>

                        <time className="shrink-0 text-right text-[9px] leading-4 text-slate-400">
                          {formatDate(item.createdAt)}
                        </time>
                      </div>

                      {item.note && (
                        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-5 text-slate-500">
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}

                  {order.history.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-[11px] text-slate-400">
                      কোনো status history নেই।
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-lg bg-slate-50/70 px-2.5 py-2">
      <span className="shrink-0 text-slate-400">{label}</span>

      <span className="min-w-0 break-all text-right font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function OrderEditModal({
  order,
  onClose,
  onSaved,
}: {
  order: Order;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [items, setItems] = useState(() =>
    order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      applyPriceToCatalog: false,
    })),
  );
  const [deliveryCharge, setDeliveryCharge] = useState(order.deliveryCharge);
  const [courierCost, setCourierCost] = useState(order.courierCost ?? 0);
  const [gatewayFee, setGatewayFee] = useState(order.gatewayFee ?? 0);
  const [otherCost, setOtherCost] = useState(order.otherCost ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0,
  );

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/commerce/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(({ name: _name, ...item }) => item),
            deliveryCharge,
            courierCost,
            gatewayFee,
            otherCost,
            note: "Admin edited quantity/price/cost",
          }),
        },
      );
      const body = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Order update failed");
      await onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Order update failed",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ef4277]">
              {order.orderNumber}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#062a54]">
              Edit order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-4 p-4 sm:p-6">
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-2xl border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_110px_150px] md:items-end"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {item.name}
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <input
                      type="checkbox"
                      checked={item.applyPriceToCatalog}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((entry, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...entry,
                                  applyPriceToCatalog: event.target.checked,
                                }
                              : entry,
                          ),
                        )
                      }
                      className="size-4 accent-[#ef4277]"
                    />
                    এই price catalog-এর পরবর্তী order-এও ব্যবহার হবে
                  </label>
                </div>
                <label className="text-xs font-bold text-slate-500">
                  Quantity
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...entry,
                                quantity: Math.max(
                                  1,
                                  Number(event.target.value),
                                ),
                              }
                            : entry,
                        ),
                      )
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
                  />
                </label>
                <label className="text-xs font-bold text-slate-500">
                  Order sell price
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...entry,
                                unitPrice: Math.max(
                                  0,
                                  Number(event.target.value),
                                ),
                              }
                            : entry,
                        ),
                      )
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
                  />
                </label>
              </article>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Delivery charge", deliveryCharge, setDeliveryCharge],
              ["Actual courier cost", courierCost, setCourierCost],
              ["Gateway fee", gatewayFee, setGatewayFee],
              ["Other cost", otherCost, setOtherCost],
            ].map(([label, value, setter]) => (
              <label
                key={String(label)}
                className="text-xs font-bold text-slate-500"
              >
                {String(label)}
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(value)}
                  onChange={(event) =>
                    (setter as (value: number) => void)(
                      Math.max(0, Number(event.target.value)),
                    )
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ef4277]"
                />
              </label>
            ))}
          </div>
          <div className="rounded-2xl bg-[#fff4f6] p-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <strong className="text-slate-800">
                {formatMoney(subtotal)}
              </strong>
            </div>
            <div className="mt-2 flex justify-between border-t border-pink-100 pt-2 font-extrabold text-[#062a54]">
              <span>New total</span>
              <span>{formatMoney(subtotal + deliveryCharge)}</span>
            </div>
          </div>
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save order
          </button>
        </footer>
      </section>
    </div>
  );
}
