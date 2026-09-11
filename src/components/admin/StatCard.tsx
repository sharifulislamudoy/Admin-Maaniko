import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  accent: "pink" | "blue" | "navy" | "green";
};

const accents = {
  pink: "bg-[#fff0f5] text-[#ef4277]",
  blue: "bg-[#eaf8fe] text-[#10a9e8]",
  navy: "bg-[#eef3f8] text-[#062a54]",
  green: "bg-emerald-50 text-emerald-600",
};

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  accent,
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-[#dce3ec] bg-white p-5 shadow-[0_12px_40px_rgba(6,42,84,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(6,42,84,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#062a54]">
            {value}
          </p>
        </div>
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accents[accent]}`}
        >
          <Icon className="size-6" />
        </span>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
        <TrendingUp className="size-3.5" />
        {change}
      </p>
    </article>
  );
}
