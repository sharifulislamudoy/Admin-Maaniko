"use client";

import {
  Bot,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Analytics = {
  days: number;
  questions: number;
  uniqueVisitors: number;
  tokens: { prompt: number; completion: number; total: number };
  averageResponseMs: number;
  topics: {
    key: string;
    label: string;
    questions: number;
    tokens: number;
    percentage: number;
  }[];
};

const formatter = new Intl.NumberFormat("bn-BD");

export default function AiAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ai-analytics?days=${days}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "তথ্য লোড করা যায়নি");
      setData(body);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "তথ্য লোড করা যায়নি",
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const cards = [
    {
      label: "মোট প্রশ্ন",
      value: data ? formatter.format(data.questions) : "—",
      icon: MessageSquareText,
      style: "bg-[#ef4277]/10 text-[#ef4277]",
    },
    {
      label: "মোট Token",
      value: data ? formatter.format(data.tokens.total) : "—",
      icon: Sparkles,
      style: "bg-violet-100 text-violet-600",
    },
    {
      label: "AI ব্যবহারকারী",
      value: data ? formatter.format(data.uniqueVisitors) : "—",
      icon: Users,
      style: "bg-sky-100 text-sky-600",
    },
    {
      label: "গড় Response",
      value: data ? `${(data.averageResponseMs / 1000).toFixed(1)}s` : "—",
      icon: Clock3,
      style: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-[#dce3ec] bg-white shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce3ec] bg-gradient-to-r from-[#fff7fa] via-white to-[#f2fbff] px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#062a54] to-[#0aa7e8] text-white shadow-sm">
            <Bot className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#062a54]">
              Maaniko AI Analytics
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Token ব্যবহার ও ক্রেতাদের সবচেয়ে বেশি জিজ্ঞাসিত বিষয়
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="h-10 rounded-xl border border-[#dce3ec] bg-white px-3 text-xs font-bold text-[#062a54] outline-none focus:border-[#ef4277]"
          >
            <option value={7}>শেষ ৭ দিন</option>
            <option value={30}>শেষ ৩০ দিন</option>
            <option value={90}>শেষ ৯০ দিন</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="রিফ্রেশ করুন"
            className="grid size-10 place-items-center rounded-xl border border-[#dce3ec] bg-white text-[#062a54] transition hover:border-[#ef4277]/40 hover:text-[#ef4277] disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <div
                      className={`grid size-9 place-items-center rounded-xl ${card.style}`}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xl font-black text-[#062a54]">
                      {loading ? "…" : card.value}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
              <div>
                <h3 className="text-sm font-black text-[#062a54]">
                  সবচেয়ে বেশি জিজ্ঞাসিত বিষয়
                </h3>
                <div className="mt-4 space-y-3">
                  {!loading && data?.topics.length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      এখনো কোনো AI প্রশ্ন নেই।
                    </p>
                  )}
                  {data?.topics.map((topic) => (
                    <div key={topic.key}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-slate-700">
                          {topic.label}
                        </span>
                        <span className="font-black text-[#062a54]">
                          {formatter.format(topic.questions)} প্রশ্ন ·{" "}
                          {formatter.format(topic.percentage)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#ef4277] to-[#10a9e8] transition-all duration-700"
                          style={{ width: `${topic.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#e8edf3] bg-[#f8fafc] p-4">
                <h3 className="text-sm font-black text-[#062a54]">
                  Token breakdown
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Input token</dt>
                    <dd className="font-black text-[#062a54]">
                      {formatter.format(data?.tokens.prompt ?? 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Output token</dt>
                    <dd className="font-black text-[#062a54]">
                      {formatter.format(data?.tokens.completion ?? 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
                    <dt className="font-bold text-slate-600">সর্বমোট</dt>
                    <dd className="font-black text-[#ef4277]">
                      {formatter.format(data?.tokens.total ?? 0)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
