"use client";

import { Boxes, History, Loader2, PackagePlus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Variant = {
  id: string;
  sku: string;
  image: string | null;
  label: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  soldStock: number;
  purchaseCost: number;
  packagingCost: number;
  sellingPrice: number;
  mrp: number | null;
};
type Product = {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  category: string;
  status: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  soldStock: number;
  purchaseCost: number;
  packagingCost: number;
  sellingPrice: number;
  mrp: number | null;
  stockValue: number;
  variants: Variant[];
};
type Target = { product: Product; variant?: Variant };
type ProductHistory = {
  product: Product;
  analytics: {
    totalOrderedQuantity: number;
    deliveredQuantity: number;
    uniqueCustomers: number;
    totalStockAdded: number;
  };
  customers: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    status: string;
    quantity: number;
    unitPrice: number;
    variantSku: string | null;
    orderedAt: string;
  }>;
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost: number | null;
    supplier: string | null;
    variantSku: string | null;
    note: string | null;
    createdAt: string;
  }>;
};

const money = (value: number) =>
  `৳ ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/commerce/inventory?search=${encodeURIComponent(search)}`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as Product[] & { message?: string };
      if (!response.ok)
        throw new Error(body.message ?? "Inventory load failed");
      setProducts(body);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Inventory load failed",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);
  const summary = useMemo(
    () =>
      products.reduce(
        (total, product) => {
          const rows = product.variants.length ? product.variants : [product];
          return {
            stock:
              total.stock + rows.reduce((sum, item) => sum + item.stock, 0),
            reserved:
              total.reserved +
              rows.reduce((sum, item) => sum + item.reservedStock, 0),
            sold:
              total.sold + rows.reduce((sum, item) => sum + item.soldStock, 0),
            value:
              total.value +
              rows.reduce(
                (sum, item) => sum + item.stock * item.purchaseCost,
                0,
              ),
          };
        },
        { stock: 0, reserved: 0, sold: 0, value: 0 },
      ),
    [products],
  );

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[.17em] text-[#ef4277]">
          Stock control
        </p>
        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#062a54]">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              On-hand, reserved, available, sold stock এবং variant cost এক জায়গা
              থেকে নিয়ন্ত্রণ করুন।
            </p>
            <p className="mt-1 text-xs font-semibold text-amber-600">
              Pending থেকে Shipped পর্যন্ত stock Reserved থাকবে; Delivered হলে On-hand থেকে কমবে।
            </p>
          </div>
          <label className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product বা SKU search..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#ef4277]"
            />
          </label>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["On-hand stock", summary.stock],
          ["Reserved", summary.reserved],
          ["Sold", summary.sold],
          ["Stock value", money(summary.value)],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-extrabold text-[#062a54]">
              {value}
            </p>
          </div>
        ))}
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-[#fff4f6] text-[#062a54]">
              <tr>
                {[
                  "Product / Variant",
                  "On hand",
                  "Reserved",
                  "Available",
                  "Sold",
                  "Purchase cost",
                  "Packaging",
                  "Sell price",
                  "MRP",
                  "Action",
                ].map((item) => (
                  <th key={item} className="px-4 py-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products
                .flatMap((product): Target[] =>
                  product.variants.length
                    ? product.variants.map((variant) => ({ product, variant }))
                    : [{ product }],
                )
                .map(({ product, variant }) => {
                  const row = variant ?? product;
                  return (
                    <tr
                      key={variant?.id ?? product.id}
                      className="hover:bg-pink-50/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {(variant?.image ?? product.image) ? (
                            <img
                              src={variant?.image ?? product.image ?? ""}
                              alt=""
                              className="size-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="grid size-10 place-items-center rounded-lg bg-slate-100">
                              <Boxes className="size-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-800">
                              {variant
                                ? `${product.name} — ${variant.label || "Variant"}`
                                : product.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                              {row.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold">{row.stock}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">
                        {row.reservedStock}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {row.availableStock}
                      </td>
                      <td className="px-4 py-3">{row.soldStock}</td>
                      <td className="px-4 py-3">{money(row.purchaseCost)}</td>
                      <td className="px-4 py-3">{money(row.packagingCost)}</td>
                      <td className="px-4 py-3 font-bold text-[#062a54]">
                        {money(row.sellingPrice)}
                      </td>
                      <td className="px-4 py-3">
                        {row.mrp ? money(row.mrp) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTarget({ product, variant })}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#ef4277] px-2.5 py-2 text-[10px] font-bold text-white"
                          >
                            <PackagePlus className="size-3" />
                            Adjust
                          </button>
                          <button
                            onClick={() => setHistoryProduct(product)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-slate-600"
                          >
                            <History className="size-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    কোনো product পাওয়া যায়নি।
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 p-4 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Loading inventory...
          </div>
        ) : null}
      </section>
      {target ? (
        <AdjustmentModal
          target={target}
          onClose={() => setTarget(null)}
          onSaved={async () => {
            setTarget(null);
            await load();
          }}
        />
      ) : null}
      {historyProduct ? (
        <ProductHistoryModal
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      ) : null}
    </div>
  );
}

function AdjustmentModal({
  target,
  onClose,
  onSaved,
}: {
  target: Target;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const row = target.variant ?? target.product;
  const [form, setForm] = useState({
    mode: "ADD",
    quantity: 0,
    supplierName: "",
    supplierPhone: "",
    purchaseCost: row.purchaseCost,
    packagingCost: row.packagingCost,
    sellingPrice: row.sellingPrice,
    mrp: row.mrp ?? 0,
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          purchaseCost: Number(form.purchaseCost),
          packagingCost: Number(form.packagingCost),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp),
          targetType: target.variant ? "VARIANT" : "PRODUCT",
          productId: target.product.id,
          variantId: target.variant?.id,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Update failed");
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }
  const field = (key: keyof typeof form, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-5">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold text-[#ef4277]">{row.sku}</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#062a54]">
              Stock & price adjustment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Available: {row.availableStock} · Reserved: {row.reservedStock}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-500">
            Stock operation
            <select
              value={form.mode}
              onChange={(e) => field("mode", e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
            >
              <option value="ADD">Add stock</option>
              <option value="REMOVE">Remove stock</option>
              <option value="SET">Set exact stock</option>
            </select>
          </label>
          <Input
            label="Quantity"
            value={form.quantity}
            onChange={(v) => field("quantity", Number(v))}
          />
          <Input
            label="Purchase cost"
            value={form.purchaseCost}
            onChange={(v) => field("purchaseCost", Number(v))}
          />
          <Input
            label="Packaging cost"
            value={form.packagingCost}
            onChange={(v) => field("packagingCost", Number(v))}
          />
          <Input
            label="Selling price"
            value={form.sellingPrice}
            onChange={(v) => field("sellingPrice", Number(v))}
          />
          <Input
            label="MRP"
            value={form.mrp}
            onChange={(v) => field("mrp", Number(v))}
          />
          <Input
            label="Supplier name"
            type="text"
            value={form.supplierName}
            onChange={(v) => field("supplierName", v)}
          />
          <Input
            label="Supplier phone"
            type="text"
            value={form.supplierPhone}
            onChange={(v) => field("supplierPhone", v)}
          />
          <label className="text-xs font-bold text-slate-500 sm:col-span-2">
            Note
            <textarea
              value={form.note}
              onChange={(e) => field("note", e.target.value)}
              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#ef4277]"
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
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}Save
            changes
          </button>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "number",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-xs font-bold text-slate-500">
      {label}
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#ef4277]"
      />
    </label>
  );
}

export function ProductHistoryModal({
  product,
  onClose,
}: {
  product: { id: string; name: string; sku: string };
  onClose: () => void;
}) {
  const [data, setData] = useState<ProductHistory | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch(
      `/api/commerce/inventory/products/${encodeURIComponent(product.id)}/history`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.message ?? "History load failed");
        setData(body);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "History load failed",
        ),
      );
  }, [product.id]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-5">
      <section className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold text-[#ef4277]">{product.sku}</p>
            <h2 className="text-xl font-extrabold text-[#062a54]">
              {product.name} analytics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-rose-700">
            {error}
          </p>
        ) : null}
        {!data ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="size-6 animate-spin text-[#ef4277]" />
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Object.entries(data.analytics).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {key.replaceAll(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-[#062a54]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-extrabold text-[#062a54]">
              Who ordered this product
            </h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Phone",
                      "Variant",
                      "Qty",
                      "Price",
                      "Status",
                      "Date",
                    ].map((item) => (
                      <th key={item} className="px-3 py-2">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-bold">
                        {item.orderNumber}
                      </td>
                      <td className="px-3 py-2">{item.customerName}</td>
                      <td className="px-3 py-2">{item.phone}</td>
                      <td className="px-3 py-2">{item.variantSku ?? "—"}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{money(item.unitPrice)}</td>
                      <td className="px-3 py-2">{item.status}</td>
                      <td className="px-3 py-2">{date(item.orderedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-6 font-extrabold text-[#062a54]">
              Stock history & suppliers
            </h3>
            <div className="mt-2 space-y-2">
              {data.movements.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-extrabold text-slate-700">
                      {item.type} · {item.quantity > 0 ? "+" : ""}
                      {item.quantity}
                    </p>
                    <p className="mt-1 text-slate-400">
                      {item.supplier ?? "No supplier"}{" "}
                      {item.variantSku ? `· ${item.variantSku}` : ""}{" "}
                      {item.note ? `· ${item.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-slate-500">
                    <p>
                      {item.previousStock} → {item.newStock}{" "}
                      {item.unitCost !== null
                        ? `· ${money(item.unitCost)}`
                        : ""}
                    </p>
                    <p className="mt-1 text-[10px]">{date(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
