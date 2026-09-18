"use client";

import {
  BadgeCheck,
  Boxes,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  PackageOpen,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ReviewTarget = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  targetType: "PRODUCT" | "COMBO" | "OVERALL";
  target: ReviewTarget | null;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    deliveredAt: string | null;
  };
};

type ReviewSummary = {
  total: number;
  averageRating: number;
  productReviews: number;
  comboReviews: number;
  overallReviews: number;
  distribution: Record<string, number>;
};

type ReviewsResponse = {
  summary: ReviewSummary;
  data: AdminReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const EMPTY_SUMMARY: ReviewSummary = {
  total: 0,
  averageRating: 0,
  productReviews: 0,
  comboReviews: 0,
  overallReviews: 0,
  distribution: {},
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type: AdminReview["targetType"]) {
  if (type === "PRODUCT") return "Product";
  if (type === "COMBO") return "Solution box";
  return "Overall order";
}

export default function ReviewsManager() {
  const [response, setResponse] = useState<ReviewsResponse | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [target, setTarget] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) query.set("search", search);
      if (rating) query.set("rating", rating);
      if (target) query.set("target", target);

      const request = await fetch(`/api/commerce/reviews?${query.toString()}`, {
        cache: "no-store",
      });
      const body = (await request.json()) as ReviewsResponse & {
        message?: string;
      };
      if (!request.ok) throw new Error(body.message ?? "Reviews load failed");
      setResponse(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Reviews load failed");
    } finally {
      setLoading(false);
    }
  }, [page, rating, search, target]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const summary = response?.summary ?? EMPTY_SUMMARY;
  const reviews = response?.data ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ef4277]">
            Customer feedback
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#062a54] sm:text-3xl">
            Customer reviews
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Delivered orders থেকে পাওয়া verified order, product এবং solution
            box reviews দেখুন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-pink-200 hover:text-[#ef4277] disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          label="Total reviews"
          value={summary.total}
          tone="bg-pink-50 text-[#ef4277]"
        />
        <StatCard
          icon={Star}
          label="Average rating"
          value={summary.averageRating.toFixed(1)}
          suffix="/ 5"
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Boxes}
          label="Product reviews"
          value={summary.productReviews}
          tone="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={PackageOpen}
          label="Solution box reviews"
          value={summary.comboReviews}
          tone="bg-violet-50 text-violet-600"
        />
      </div>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5">
        <form
          onSubmit={submitSearch}
          className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_150px_170px_auto]"
        >
          <label className="relative">
            <span className="sr-only">Search reviews</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Order, customer or review..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-[#ef4277] focus:ring-4 focus:ring-pink-50"
            />
          </label>
          <select
            value={rating}
            onChange={(event) => {
              setRating(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#ef4277]"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star
              </option>
            ))}
          </select>
          <select
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#ef4277]"
          >
            <option value="">All review types</option>
            <option value="OVERALL">Overall order</option>
            <option value="PRODUCT">Product</option>
            <option value="COMBO">Solution box</option>
          </select>
          <button
            type="submit"
            className="h-11 rounded-xl bg-[#062a54] px-5 text-sm font-bold text-white transition hover:bg-[#0b3d73]"
          >
            Search
          </button>
        </form>

        <RatingDistribution summary={summary} />
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-black text-[#062a54]">Review list</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {pagination.total} matching review{pagination.total === 1 ? "" : "s"}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            Verified purchases
          </span>
        </div>

        {loading && !response ? (
          <div className="grid min-h-64 place-items-center">
            <RefreshCw className="size-6 animate-spin text-[#ef4277]" />
          </div>
        ) : reviews.length ? (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Customer & order</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Attached to</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <ReviewRow key={review.id} review={review} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <MessageSquareText className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 font-bold text-slate-500">No reviews found</p>
              <p className="mt-1 text-sm text-slate-400">
                Customer review দিলে এখানে automatically দেখা যাবে।
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
              className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: typeof Star;
  label: string;
  value: string | number;
  suffix?: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-black text-[#062a54] sm:text-2xl">
        {value} {suffix ? <span className="text-xs text-slate-400">{suffix}</span> : null}
      </p>
    </article>
  );
}

function RatingDistribution({ summary }: { summary: ReviewSummary }) {
  const max = Math.max(1, ...Object.values(summary.distribution));
  return (
    <div className="space-y-1.5 rounded-2xl bg-slate-50 px-3 py-2.5">
      {[5, 4, 3, 2, 1].map((value) => {
        const count = summary.distribution[String(value)] ?? 0;
        return (
          <div key={value} className="grid grid-cols-[18px_1fr_26px] items-center gap-2 text-[10px]">
            <span className="font-bold text-slate-500">{value}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <span
                className="block h-full rounded-full bg-amber-400"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-bold text-slate-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} star`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewTargetView({ review }: { review: AdminReview }) {
  const Icon =
    review.targetType === "PRODUCT"
      ? Boxes
      : review.targetType === "COMBO"
        ? PackageOpen
        : ShoppingBag;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {review.target?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.target.image}
          alt=""
          className="size-9 shrink-0 rounded-lg border border-slate-100 object-cover"
        />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase text-slate-400">
          {typeLabel(review.targetType)}
        </span>
        <span className="block max-w-44 truncate text-xs font-bold text-[#062a54]">
          {review.target?.name ?? "Entire order"}
        </span>
      </span>
    </div>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  return (
    <tr className="align-top transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-[#062a54]">{review.order.customerName}</p>
        <p className="mt-0.5 text-xs text-slate-400">{review.order.phone}</p>
        <a
          href={`/orders?search=${encodeURIComponent(review.order.orderNumber)}`}
          className="mt-1 inline-block text-xs font-bold text-[#ef4277] hover:underline"
        >
          #{review.order.orderNumber}
        </a>
      </td>
      <td className="px-4 py-4">
        <Stars rating={review.rating} />
        {review.isVerified ? (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <BadgeCheck className="size-3" /> Verified
          </span>
        ) : null}
      </td>
      <td className="max-w-md px-4 py-4 text-sm leading-6 text-slate-600">
        {review.comment || <span className="italic text-slate-400">Rating only</span>}
      </td>
      <td className="px-4 py-4">
        <ReviewTargetView review={review} />
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
        {formatDate(review.createdAt)}
      </td>
    </tr>
  );
}

function ReviewCard({ review }: { review: AdminReview }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#062a54]">
            {review.order.customerName}
          </p>
          <a
            href={`/orders?search=${encodeURIComponent(review.order.orderNumber)}`}
            className="text-xs font-bold text-[#ef4277]"
          >
            #{review.order.orderNumber}
          </a>
        </div>
        <div className="text-right">
          <Stars rating={review.rating} />
          <p className="mt-1 text-[10px] text-slate-400">
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {review.comment || <span className="italic text-slate-400">Rating only</span>}
      </p>
      <div className="mt-3 rounded-2xl bg-slate-50 p-2.5">
        <ReviewTargetView review={review} />
      </div>
    </article>
  );
}
