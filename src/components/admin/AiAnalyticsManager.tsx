"use client";

import {
  Bot,
  CheckCircle2,
  Clock3,
  Eye,
  MessageCircleQuestion,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ConversationSummary = {
  conversationId: string;
  visitor: string;
  topic: string;
  intent: string;
  lastQuestion: string;
  lastAnswer: string;
  lastMessageAt: string;
  turns: number;
  needsFollowUp: boolean;
  resolved: boolean;
  feedback: boolean | null;
};

type Analytics = {
  days: number;
  questions: number;
  uniqueVisitors: number;
  conversations: number;
  unresolvedConversations: number;
  averageTurns: number;
  followUpRate: number;
  satisfactionRate: number;
  feedback: { positive: number; negative: number; total: number };
  knowledge: { pending: number; approved: number; rejected: number };
  knowledgeQueue: Array<{
    id: string;
    question: string;
    answer: string;
    intent: string;
    keywords: string[];
    updatedAt: string;
  }>;
  tokens: { prompt: number; completion: number; total: number };
  averageResponseMs: number;
  topics: Array<{
    key: string;
    label: string;
    questions: number;
    tokens: number;
    percentage: number;
  }>;
  popularQuestions: Array<{ question: string; count: number }>;
  recentConversations: ConversationSummary[];
  needsReview: Array<{
    id: string;
    conversationId: string;
    question: string;
    answer: string;
    intent: string;
    helpful: boolean | null;
    needsFollowUp: boolean;
    feedback: string | null;
    createdAt: string;
  }>;
};

type ConversationDetail = {
  conversationId: string;
  messages: Array<{
    id: string;
    question: string;
    answer: string;
    intent: string;
    topic: string;
    needsFollowUp: boolean;
    resolved: boolean;
    helpful: boolean | null;
    feedback: string | null;
    responseTimeMs: number;
    totalTokens: number;
    createdAt: string;
  }>;
};

const number = new Intl.NumberFormat("bn-BD");
const date = new Intl.DateTimeFormat("bn-BD", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AiAnalyticsManager() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [knowledgeDrafts, setKnowledgeDrafts] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ai-analytics?days=${days}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Analytics লোড করা যায়নি");
      setData(body);
      setKnowledgeDrafts(
        Object.fromEntries(
          (body.knowledgeQueue ?? []).map((item: { id: string; answer: string }) => [item.id, item.answer]),
        ),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Analytics লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const conversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.recentConversations ?? [];
    return (data?.recentConversations ?? []).filter((item) =>
      [item.lastQuestion, item.lastAnswer, item.intent, item.topic]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  async function openConversation(conversationId: string) {
    setDetailLoading(true);
    try {
      const response = await fetch(
        `/api/ai-analytics/conversations/${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Conversation লোড করা যায়নি");
      setDetail(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Conversation লোড করা যায়নি");
    } finally {
      setDetailLoading(false);
    }
  }

  async function reviewKnowledge(
    knowledgeId: string,
    status: "APPROVED" | "REJECTED",
  ) {
    setReviewingId(knowledgeId);
    setError("");
    try {
      const response = await fetch(`/api/ai-analytics/knowledge/${knowledgeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, answer: knowledgeDrafts[knowledgeId] }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Review save করা যায়নি");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review save করা যায়নি");
    } finally {
      setReviewingId("");
    }
  }

  const cards = [
    { label: "Conversation", value: data?.conversations, icon: MessageSquareText, color: "bg-pink-50 text-[#ef4277]" },
    { label: "AI ব্যবহারকারী", value: data?.uniqueVisitors, icon: Users, color: "bg-sky-50 text-sky-600" },
    { label: "মোট প্রশ্ন", value: data?.questions, icon: Sparkles, color: "bg-violet-50 text-violet-600" },
    { label: "অসম্পূর্ণ need", value: data?.unresolvedConversations, icon: MessageCircleQuestion, color: "bg-amber-50 text-amber-700" },
    { label: "সন্তুষ্টির হার", value: `${data?.satisfactionRate ?? 0}%`, icon: ThumbsUp, color: "bg-emerald-50 text-emerald-700" },
    { label: "গড় response", value: `${((data?.averageResponseMs ?? 0) / 1000).toFixed(1)}s`, icon: Clock3, color: "bg-slate-100 text-[#062a54]" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[#dce3ec] bg-white shadow-[0_14px_45px_rgba(6,42,84,.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#fff7fa] via-white to-[#effaff] px-5 py-6 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#062a54] text-white shadow-lg shadow-[#062a54]/15">
              <Bot className="size-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#ef4277]">Customer intelligence</p>
              <h1 className="mt-1 text-xl font-black text-[#062a54] sm:text-2xl">Maaniko AI Analytics</h1>
              <p className="mt-1 text-xs text-slate-500">Customer কী জানতে চায়, কোথায় আটকে যায় এবং AI কতটা সাহায্য করছে</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-11 rounded-xl border border-[#dce3ec] bg-white px-3 text-xs font-bold text-[#062a54] outline-none focus:border-[#ef4277]">
              <option value={7}>শেষ ৭ দিন</option>
              <option value={30}>শেষ ৩০ দিন</option>
              <option value={90}>শেষ ৯০ দিন</option>
            </select>
            <button type="button" onClick={() => void load()} disabled={loading} className="grid size-11 place-items-center rounded-xl border border-[#dce3ec] bg-white text-[#062a54] hover:text-[#ef4277] disabled:opacity-50" aria-label="রিফ্রেশ করুন">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-[#e7ebf0] bg-white p-4 shadow-sm">
            <div className={`grid size-9 place-items-center rounded-xl ${color}`}><Icon className="size-[18px]" /></div>
            <p className="mt-3 text-[11px] font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-black text-[#062a54]">{loading ? "…" : typeof value === "number" ? number.format(value) : value ?? "—"}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[#dce3ec] bg-white p-5 sm:p-6">
          <h2 className="text-base font-black text-[#062a54]">সবচেয়ে বেশি জিজ্ঞাসিত বিষয়</h2>
          <div className="mt-5 space-y-4">
            {data?.topics.map((topic) => (
              <div key={topic.key}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-bold text-slate-600">{topic.label}</span><span className="font-black text-[#062a54]">{number.format(topic.questions)} · {topic.percentage}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#ef4277] to-[#10a9e8]" style={{ width: `${topic.percentage}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#dce3ec] bg-white p-5 sm:p-6">
          <h2 className="text-base font-black text-[#062a54]">বারবার করা প্রশ্ন</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {data?.popularQuestions.map((item, index) => (
              <div key={`${item.question}-${index}`} className="flex items-start gap-3 py-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff1f5] text-[11px] font-black text-[#ef4277]">{number.format(index + 1)}</span>
                <p className="min-w-0 flex-1 text-sm leading-5 text-slate-700">{item.question}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{number.format(item.count)} বার</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dce3ec] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#062a54]">Controlled AI learning</h2>
            <p className="mt-1 text-xs text-slate-500">সঠিক উত্তর approve করলে পরবর্তী relevant প্রশ্নে AI সেটি knowledge হিসেবে ব্যবহার করবে</p>
          </div>
          <div className="flex gap-2 text-[10px] font-black">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Pending {number.format(data?.knowledge.pending ?? 0)}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Approved {number.format(data?.knowledge.approved ?? 0)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">Rejected {number.format(data?.knowledge.rejected ?? 0)}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {data?.knowledgeQueue.slice(0, 8).map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-black text-sky-700">{item.intent}</span>
                {item.keywords.slice(0, 4).map((keyword) => <span key={keyword} className="text-[10px] text-slate-400">#{keyword}</span>)}
              </div>
              <p className="mt-3 text-sm font-black leading-5 text-[#062a54]">{item.question}</p>
              <textarea
                value={knowledgeDrafts[item.id] ?? item.answer}
                onChange={(event) => setKnowledgeDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                rows={4}
                className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-[#ef4277]/50"
                placeholder="Admin-verified সঠিক উত্তর লিখুন"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" disabled={reviewingId === item.id} onClick={() => void reviewKnowledge(item.id, "REJECTED")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 hover:text-rose-600 disabled:opacity-50">Reject</button>
                <button type="button" disabled={reviewingId === item.id || !(knowledgeDrafts[item.id] ?? item.answer).trim()} onClick={() => void reviewKnowledge(item.id, "APPROVED")} className="rounded-xl bg-[#062a54] px-3 py-2 text-[10px] font-black text-white hover:bg-[#0b3b6d] disabled:opacity-50">{reviewingId === item.id ? "Saving…" : "Approve & learn"}</button>
              </div>
            </article>
          ))}
          {!loading && data?.knowledgeQueue.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 xl:col-span-2">নতুন কোনো learning candidate নেই।</div>
          )}
        </div>
      </section>

      {Boolean(data?.needsReview.length) && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="size-5 text-amber-700" />
            <h2 className="text-base font-black text-[#062a54]">Review প্রয়োজন</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
              {number.format(data?.needsReview.length ?? 0)}
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data?.needsReview.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openConversation(item.conversationId)}
                className="rounded-2xl border border-amber-200/70 bg-white p-4 text-left shadow-sm transition hover:border-[#ef4277]/35"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">{item.intent}</span>
                  <span className={`text-[10px] font-bold ${item.helpful === false ? "text-rose-600" : "text-amber-700"}`}>
                    {item.helpful === false ? "সহায়ক হয়নি" : "Follow-up অসম্পূর্ণ"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-slate-700">{item.question}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-[#dce3ec] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-black text-[#062a54]">সাম্প্রতিক conversation</h2><p className="mt-1 text-xs text-slate-500">সংবেদনশীল তথ্য স্বয়ংক্রিয়ভাবে mask করা</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#dce3ec] px-3 sm:w-72"><Search className="size-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="প্রশ্ন বা intent খুঁজুন" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3 font-bold">শেষ প্রশ্ন</th><th className="pb-3 font-bold">Intent</th><th className="pb-3 font-bold">Turn</th><th className="pb-3 font-bold">অবস্থা</th><th className="pb-3 font-bold">Feedback</th><th className="pb-3 text-right font-bold">সময়</th><th className="pb-3" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((item) => (
                <tr key={item.conversationId} className="align-top hover:bg-slate-50/70">
                  <td className="max-w-sm py-3 pr-4 font-semibold leading-5 text-slate-700">{item.lastQuestion}</td>
                  <td className="py-3 pr-4"><span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-700">{item.intent}</span></td>
                  <td className="py-3 pr-4 font-black text-[#062a54]">{number.format(item.turns)}</td>
                  <td className="py-3 pr-4">{item.resolved ? <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="size-3.5" /> সম্পূর্ণ</span> : <span className="font-bold text-amber-700">Follow-up</span>}</td>
                  <td className="py-3 pr-4">{item.feedback === true ? <ThumbsUp className="size-4 text-emerald-600" /> : item.feedback === false ? <ThumbsDown className="size-4 text-rose-600" /> : <span className="text-slate-300">—</span>}</td>
                  <td className="whitespace-nowrap py-3 text-right text-slate-500">{date.format(new Date(item.lastMessageAt))}</td>
                  <td className="py-3 pl-3"><button type="button" onClick={() => void openConversation(item.conversationId)} disabled={detailLoading} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-[#062a54] hover:border-[#ef4277]/40 hover:text-[#ef4277]" aria-label="Conversation দেখুন"><Eye className="size-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#062a54]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
          <section className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[#f7f9fb] shadow-2xl sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><h3 className="font-black text-[#062a54]">সম্পূর্ণ conversation</h3><p className="mt-0.5 text-[10px] text-slate-400">ID: {detail.conversationId}</p></div><button type="button" onClick={() => setDetail(null)} className="grid size-9 place-items-center rounded-full bg-slate-100"><X className="size-4" /></button></header>
            <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
              {detail.messages.map((turn) => (
                <div key={turn.id} className="space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#062a54] px-4 py-3 text-sm text-white">{turn.question}</div>
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">{turn.answer}</div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400"><span>{turn.intent}</span><span>•</span><span>{(turn.responseTimeMs / 1000).toFixed(1)}s</span><span>•</span><span>{number.format(turn.totalTokens)} token</span>{turn.helpful !== null && <><span>•</span><span className={turn.helpful ? "text-emerald-600" : "text-rose-600"}>{turn.helpful ? "সহায়ক" : "সহায়ক হয়নি"}</span></>}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
