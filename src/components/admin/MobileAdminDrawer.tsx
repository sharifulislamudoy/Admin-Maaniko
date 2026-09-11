"use client";

import { X } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import { useAdminText } from "@/context/AdminTextContext";
import type { AdminRole } from "@/types/auth";

type MobileAdminDrawerProps = {
  role: AdminRole;
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileAdminDrawer({
  role,
  isOpen,
  onClose,
}: MobileAdminDrawerProps) {
  const { t } = useAdminText();

  return (
    <div
      className={`fixed inset-0 z-50 xl:hidden ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label={t("admin.actions.closeMenu")}
        onClick={onClose}
        className={`absolute inset-0 bg-[#031a35]/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        className={`relative h-full w-[min(86vw,340px)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("admin.actions.closeMenu")}
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="size-5" />
        </button>

        <AdminSidebar role={role} onNavigate={onClose} />
      </aside>
    </div>
  );
}
