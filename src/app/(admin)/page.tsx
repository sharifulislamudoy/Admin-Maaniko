"use client";

import {
  Bot,
  Boxes,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  Images,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  Shapes,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardSummary = {
  customers: number;
  guests: number;

  products: {
    total: number;
    active: number;
  };

  combos: {
    total: number;
    active: number;
  };

  categories: number;

  orders: {
    total: number;
    pending: number;
  };

  banners: {
    total: number;
    active: number;
  };

  guides: {
    total: number;
    published: number;
  };

  contentPages: {
    total: number;
    published: number;
  };

  admins: {
    total: number;
    pending: number;
  };

  aiCredits: {
    prompt: number;
    completion: number;
    total: number;
  };
};

const numberFormatter = new Intl.NumberFormat("en-US");

const iconStyles = {
  pink: "bg-[#fff0f5] text-[#ef4277]",
  blue: "bg-[#eaf8fe] text-[#10a9e8]",
  navy: "bg-[#eef3f8] text-[#062a54]",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard-summary", {
        cache: "no-store",
      });

      const body = (await response.json()) as DashboardSummary & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Dashboard data could not be loaded.",
        );
      }

      setSummary(body);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  const cards = useMemo(
    () => [
      {
        label: "Customers",
        value: summary?.customers,
        detail: "Registered customer profiles",
        href: "/customers",
        icon: UsersRound,
        accent: "pink" as const,
      },
      {
        label: "Guest Visitors",
        value: summary?.guests,
        detail: "Guest IDs not linked to customers",
        href: "/customers",
        icon: UserRound,
        accent: "blue" as const,
      },
      {
        label: "Orders",
        value: summary?.orders.total,
        detail: `${numberFormatter.format(
          summary?.orders.pending ?? 0,
        )} pending`,
        href: "/orders",
        icon: ClipboardList,
        accent: "green" as const,
      },
      {
        label: "Products",
        value: summary?.products.total,
        detail: `${numberFormatter.format(
          summary?.products.active ?? 0,
        )} active`,
        href: "/products",
        icon: Boxes,
        accent: "navy" as const,
      },
      {
        label: "Solution Boxes",
        value: summary?.combos.total,
        detail: `${numberFormatter.format(
          summary?.combos.active ?? 0,
        )} active`,
        href: "/combos",
        icon: PackageOpen,
        accent: "pink" as const,
      },
      {
        label: "Categories",
        value: summary?.categories,
        detail: "Product categories",
        href: "/categories",
        icon: Shapes,
        accent: "amber" as const,
      },
      {
        label: "Guides",
        value: summary?.guides.total,
        detail: `${numberFormatter.format(
          summary?.guides.published ?? 0,
        )} published`,
        href: "/guides",
        icon: BookOpen,
        accent: "green" as const,
      },
      {
        label: "Banners",
        value: summary?.banners.total,
        detail: `${numberFormatter.format(
          summary?.banners.active ?? 0,
        )} active`,
        href: "/banners",
        icon: Images,
        accent: "blue" as const,
      },
      {
        label: "Content Pages",
        value: summary?.contentPages.total,
        detail: `${numberFormatter.format(
          summary?.contentPages.published ?? 0,
        )} published`,
        href: "/pages/help-center",
        icon: FileText,
        accent: "navy" as const,
      },
      {
        label: "Admins",
        value: summary?.admins.total,
        detail: `${numberFormatter.format(
          summary?.admins.pending ?? 0,
        )} pending approval`,
        href: "/admin-management",
        icon: ShieldCheck,
        accent: "amber" as const,
      },
      {
        label: "AI Credit Used",
        value: summary?.aiCredits.total,
        detail: "Total recorded tokens",
        href: "/ai-assistant",
        icon: Bot,
        accent: "violet" as const,
      },
    ],
    [summary],
  );

  return (
    <main>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#062a54] sm:text-2xl">
            Dashboard Summary
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Live totals from the Maaniko database
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={loading}
          aria-label="Refresh dashboard"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dce3ec] bg-white text-[#062a54] transition hover:border-[#ef4277]/40 hover:text-[#ef4277] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-bold text-rose-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadSummary()}
            className="mt-3 text-sm font-black text-[#062a54] underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-2xl border border-[#dce3ec] bg-white p-4 shadow-[0_8px_28px_rgba(6,42,84,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#ef4277]/25 hover:shadow-[0_14px_34px_rgba(6,42,84,0.08)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                      iconStyles[card.accent]
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>

                  <ChevronRight className="mt-1 size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#ef4277]" />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-500">
                  {card.label}
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight text-[#062a54]">
                  {loading || card.value === undefined
                    ? "—"
                    : numberFormatter.format(card.value)}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {loading
                    ? "Loading database summary..."
                    : card.detail}
                </p>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}