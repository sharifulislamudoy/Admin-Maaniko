"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAdminText } from "@/context/AdminTextContext";
import { ADMIN_NAV_ITEMS, ADMIN_PAGE_GROUPS } from "@/lib/admin-navigation";
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
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    ADMIN_PAGE_GROUPS.filter((group) =>
      group.children.some((child) => pathname.startsWith(child.href)),
    ).map((group) => group.key),
  );
  const items = ADMIN_NAV_ITEMS.filter(
    (item) =>
      !(
        "superAdminOnly" in item &&
        item.superAdminOnly &&
        role !== "SUPER_ADMIN"
      ),
  );


  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#062a54] px-4 py-5 text-white">
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
      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.22)_transparent]">
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
        {ADMIN_PAGE_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups.includes(group.key);
          const isActive = group.children.some((child) => pathname.startsWith(child.href));
          return (
            <div key={group.key} className="overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((current) =>
                    current.includes(group.key)
                      ? current.filter((key) => key !== group.key)
                      : [...current, group.key],
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${isActive ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                aria-expanded={isOpen}
              >
                <Icon className="size-5 text-[#52c7f5]" />
                <span className="min-w-0 flex-1">{group.label}</span>
                <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                  <div className="ml-5 mt-1 space-y-1 border-l border-white/15 pb-1 pl-3">
                    {group.children.map((child) => {
                      const active = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={`block rounded-xl px-3 py-2.5 text-xs font-bold transition ${active ? "bg-white text-[#062a54]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="mt-4 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/60">
        <p className="font-extrabold text-white">Google সুরক্ষিত</p>
        <p className="mt-1">NestJS JWT ও রোলভিত্তিক অ্যাক্সেস</p>
      </div>
    </aside>
  );
}
