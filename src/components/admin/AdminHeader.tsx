"use client";

import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAdminText } from "@/context/AdminTextContext";
import type { Session } from "next-auth";

export default function AdminHeader({
  onOpenMenu,
  user,
}: {
  onOpenMenu: () => void;
  user: Session["user"];
}) {
  const { t } = useAdminText();
  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";
  const roleLabel = user.role === "SUPER_ADMIN" ? "সুপার অ্যাডমিন" : "অ্যাডমিন";
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce3ec] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t("admin.actions.openMenu")}
          className="grid size-11 place-items-center rounded-2xl border border-[#dce3ec] text-[#062a54] xl:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[#062a54] sm:text-lg">
            {t("admin.brand.portal")}
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">
            {t("admin.header.subtitle")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 border-l border-[#dce3ec] pl-3 md:flex">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#fff4f6] text-sm font-black text-[#ef4277]">
              {initials}
            </span>
            <span className="hidden 2xl:block">
              <span className="block text-sm font-extrabold text-[#062a54]">
                {user.name}
              </span>
              <span className="block text-[11px] text-slate-500">
                {roleLabel}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth" })}
            aria-label={t("admin.actions.logout")}
            title={t("admin.actions.logout")}
            className="grid size-11 place-items-center rounded-2xl border border-[#dce3ec] text-slate-500 transition hover:border-[#ef4277] hover:text-[#ef4277]"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
