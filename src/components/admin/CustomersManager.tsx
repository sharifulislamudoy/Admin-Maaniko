"use client";

import {
  Activity,
  Check,
  Copy,
  MessageCircle,
  RefreshCcw,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [abandoned, setAbandoned] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCartId, setCopiedCartId] = useState<string | null>(null);

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
      const [customersResponse, abandonedResponse] = await Promise.all([
        fetch("/api/commerce/customers", { cache: "no-store" }),
        fetch("/api/commerce/abandoned-carts", { cache: "no-store" }),
      ]);

      const [customersBody, abandonedBody] = await Promise.all([
        customersResponse.json(),
        abandonedResponse.json(),
      ]);

      if (!customersResponse.ok) {
        throw new Error(customersBody.message ?? "Customers load failed");
      }

      if (!abandonedResponse.ok) {
        throw new Error(abandonedBody.message ?? "Carts load failed");
      }

      setCustomers(Array.isArray(customersBody) ? customersBody : []);
      setAbandoned(Array.isArray(abandonedBody) ? abandonedBody : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!copiedCartId) return;
    const timer = window.setTimeout(() => setCopiedCartId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedCartId]);

  async function showActivity(customer: any) {
    setSelectedCustomer(customer);
    setActivity([]);

    try {
      const response = await fetch(
        `/api/commerce/customers/${encodeURIComponent(customer.id)}/activity`,
        { cache: "no-store" },
      );
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message ?? "Activity load failed");
      }

      setActivity(Array.isArray(body) ? body : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activity load failed");
    }
  }

  async function createRecoveryLink(cartId: string): Promise<string> {
    const response = await fetch(
      `/api/commerce/abandoned-carts/${encodeURIComponent(cartId)}/recovery`,
      { method: "POST" },
    );
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message ?? "Recovery link failed");
    }

    if (!body.recoveryUrl || typeof body.recoveryUrl !== "string") {
      throw new Error("Recovery URL পাওয়া যায়নি");
    }

    return body.recoveryUrl;
  }

  async function copyRecoveryLink(cart: any) {
    setError("");

    try {
      const recoveryUrl = await createRecoveryLink(cart.id);
      await copyText(recoveryUrl);
      setCopiedCartId(cart.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Recovery link কপি করা যায়নি",
      );
    }
  }

  async function recoveryMessage(cart: any) {
    const phone = cart.customer?.phone ?? cart.contact?.phone;

    if (!phone) {
      setError("এই cart-এর usable phone number নেই");
      return;
    }

    setError("");

    try {
      const recoveryUrl = await createRecoveryLink(cart.id);

      const response = await fetch("/api/commerce/abandoned-carts/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cart.customer?.name ?? cart.contact?.name,
          phone,
          subtotal: cart.subtotal,
          itemNames: cart.items.map((item: any) => item.name),
          recoveryUrl,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message ?? "Message failed");
      }

      const normalized = String(phone).replace(/\D/g, "").replace(/^0/, "880");

      window.open(
        `https://wa.me/${normalized}?text=${encodeURIComponent(body.message)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message তৈরি করা যায়নি");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-pink-500">
            Customer Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Customers & Guest Recovery
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Contact, orders, care profile, cart value, device count, activity
            এবং abandoned carts এক জায়গায়।
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-200"
        >
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] md:p-5">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-pink-500" />
          <h2 className="text-lg font-black">Abandoned carts</h2>
          <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-500">
            {abandoned.length}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Cart value</th>
                <th className="pb-3">Last activity</th>
                <th className="pb-3">Recovery</th>
              </tr>
            </thead>

            <tbody>
              {abandoned.map((cart) => {
                const hasPhone = Boolean(
                  cart.customer?.phone ?? cart.contact?.phone,
                );
                const copied = copiedCartId === cart.id;

                return (
                  <tr key={cart.id} className="border-t border-[#eef1f5]">
                    <td className="py-3">
                      <p className="font-black">
                        {cart.customer?.name ??
                          cart.contact?.name ??
                          "Anonymous"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cart.customer?.phone ??
                          cart.contact?.phone ??
                          "No phone"}
                      </p>
                    </td>

                    <td className="py-3">
                      <p className="font-bold">{cart.itemCount} items</p>
                      <p className="max-w-[250px] truncate text-xs text-slate-500">
                        {cart.items.map((item: any) => item.name).join(", ")}
                      </p>
                    </td>

                    <td className="py-3 font-black text-pink-500">
                      {money.format(cart.subtotal)}
                    </td>

                    <td className="py-3 text-xs text-slate-500">
                      {new Date(cart.lastActivityAt).toLocaleString("bn-BD")}
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!hasPhone}
                          onClick={() => void recoveryMessage(cart)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-600 disabled:opacity-40"
                        >
                          <MessageCircle className="size-3.5" />
                          WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() => void copyRecoveryLink(cart)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                        >
                          {copied ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          {copied ? "Copied" : "Copy link"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!abandoned.length ? (
            <p className="py-8 text-center text-sm text-slate-400">
              কোনো abandoned cart নেই।
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] md:p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-sky-500" />
          <h2 className="text-lg font-black">Identified customers</h2>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-black text-sky-600">
            {customers.length}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Orders</th>
                <th className="pb-3">Ordered value</th>
                <th className="pb-3">Current cart</th>
                <th className="pb-3">Care profile</th>
                <th className="pb-3">Signals</th>
                <th className="pb-3" />
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-[#eef1f5] align-top"
                >
                  <td className="py-3">
                    <p className="font-black">{customer.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{customer.phone}</p>
                    <p className="text-[10px] text-slate-400">
                      {customer.deviceCount} device • {customer.eventCount}{" "}
                      events
                    </p>
                  </td>

                  <td className="py-3 font-black">{customer.orderCount}</td>

                  <td className="py-3 font-black text-pink-500">
                    {money.format(customer.totalOrdered)}
                  </td>

                  <td className="py-3">
                    {customer.activeCart ? (
                      <>
                        <p className="font-black">
                          {customer.activeCart.status}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customer.activeCart.itemCount} items •{" "}
                          {money.format(customer.activeCart.value)}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-400">No active cart</span>
                    )}
                  </td>

                  <td className="py-3 text-xs">
                    <p className="font-bold">
                      Journey: {customer.journeySlug ?? "—"}
                    </p>
                    <p className="text-slate-500">
                      Budget:{" "}
                      {customer.budgetMax ? `≤ ৳${customer.budgetMax}` : "—"}
                    </p>
                  </td>

                  <td className="py-3 text-xs">
                    <p>{customer.recentLeads?.length ?? 0} recent leads</p>
                    <p
                      className={
                        customer.marketingConsent
                          ? "font-bold text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      Marketing: {customer.marketingConsent ? "Opted in" : "No"}
                    </p>
                  </td>

                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => void showActivity(customer)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                    >
                      Activity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setSelectedCustomer(null)}
            aria-label="Close"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black">{selectedCustomer.name}</h2>
                <p className="text-sm text-slate-500">
                  {selectedCustomer.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {activity.map((event) => (
                <div key={event.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-black">{event.type}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {event.path ?? event.entityId ?? ""}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(event.createdAt).toLocaleString("bn-BD")}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
