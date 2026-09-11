"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAdminText } from "@/context/AdminTextContext";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";
import type { AdminRole } from "@/types/auth";

export default function AdminSidebar({
  role,
  onNavigate,
}: {
  role: AdminRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useAdminText();
  const items = ADMIN_NAV_ITEMS.filter(
    (item) =>
      !(
        "superAdminOnly" in item &&
        item.superAdminOnly &&
        role !== "SUPER_ADMIN"
      ),
  );

  return (
    <aside className="flex h-full flex-col bg-[#062a54] px-4 py-5 text-white">
      <div className="flex items-center gap-3 px-2 pb-6">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#52c7f5]">
          <ShieldCheck className="size-6" />
        </span>
        <div>
          <p className="text-xl font-black">Maaniko</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8aad]">
            {t("admin.brand.portal")}
          </p>
        </div>
      </div>
      <p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">
        {t("admin.navigation.menu")}
      </p>
      <nav className="space-y-1.5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${active ? "bg-white text-[#062a54] shadow-lg" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon
                className={`size-5 ${active ? "text-[#ef4277]" : "text-[#52c7f5]"}`}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/60">
        <p className="font-extrabold text-white">Google সুরক্ষিত</p>
        <p className="mt-1">NestJS JWT ও রোলভিত্তিক অ্যাক্সেস</p>
      </div>
    </aside>
  );
}
