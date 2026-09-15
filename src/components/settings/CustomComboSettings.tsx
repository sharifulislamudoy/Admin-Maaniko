"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Field, inputClass } from "@/components/catalog/forms/FormUi";

type Settings = {
  customComboMinSubtotal: number;
  customComboDiscountPercent: number;
};

export default function CustomComboSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/store-settings/custom-combo", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "Settings could not be loaded");
        setSettings(data);
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : "Settings could not be loaded");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!settings) return;
    if (settings.customComboMinSubtotal < 0 || settings.customComboDiscountPercent < 0 || settings.customComboDiscountPercent > 100) {
      setMessage("Minimum amount must be positive and discount must be between 0 and 100.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/store-settings/custom-combo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Settings could not be saved");
      setSettings(data);
      setMessage("Custom combo settings saved successfully.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Settings could not be saved");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-72 place-items-center"><Loader2 className="size-7 animate-spin text-[#ef4277]" /></div>;

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-[#062a54] p-6 text-white md:p-8">
        <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#52c7f5]"><Settings2 className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wider text-[#ff8aad]">Store settings</p><h1 className="text-2xl font-black">Custom Solution Box discount</h1></div></div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Set how much product value a customer must add before a customised box receives a discount.</p>
      </header>

      {message ? <p className={`rounded-xl px-4 py-3 text-sm font-bold ${message.includes("successfully") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p> : null}

      {settings ? (
        <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Minimum product total (BDT)" hint="Discount starts when selected products reach this subtotal." required><input type="number" min="0" step="1" className={inputClass} value={settings.customComboMinSubtotal} onChange={(event) => setSettings({ ...settings, customComboMinSubtotal: Number(event.target.value) })} /></Field>
            <Field label="Discount percentage" hint="Applied only after the minimum product total is reached." required><input type="number" min="0" max="100" step="0.01" className={inputClass} value={settings.customComboDiscountPercent} onChange={(event) => setSettings({ ...settings, customComboDiscountPercent: Number(event.target.value) })} /></Field>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Example: Minimum <strong>৳{settings.customComboMinSubtotal}</strong> and discount <strong>{settings.customComboDiscountPercent}%</strong> means a customer gets the discount only when the selected products total at least ৳{settings.customComboMinSubtotal}.</div>
          <button type="button" disabled={saving} onClick={() => void save()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#ef4277] px-5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings</button>
        </section>
      ) : null}
    </div>
  );
}
