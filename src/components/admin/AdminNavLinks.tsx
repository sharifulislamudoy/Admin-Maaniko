"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAdminText } from "@/context/AdminTextContext";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";

type AdminNavLinksProps = {
  onNavigate?: () => void;
};

export default function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  const pathname = usePathname();
  const { t } = useAdminText();

  return (
    <nav aria-label={t("admin.navigation.menu")} className="">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`group flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition-all duration-300 ${
              isActive
                ? "bg-white text-[#062a54] shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
                : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon
              className={`size-5 shrink-0 ${isActive ? "text-[#ef4277]" : ""}`}
              strokeWidth={2}
            />

            <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>

            <ChevronRight
              className={`size-4 transition-transform group-hover:translate-x-0.5 ${
                isActive ? "text-[#10a9e8]" : "text-white/25"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
