"use client";

import { useEffect, useState, type ReactNode } from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import MobileAdminDrawer from "./MobileAdminDrawer";

import type { AdminRole, AdminStatus } from "@/types/auth";

type AdminUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: AdminRole;
  status: AdminStatus;
};

type AdminShellProps = {
  children: ReactNode;
  user: AdminUser;
};

export default function AdminShell({ children, user }: AdminShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDrawerOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc] xl:grid xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden xl:sticky xl:top-0 xl:block xl:h-screen xl:overflow-hidden">
        <AdminSidebar role={user.role} />
      </aside>

      <div className="min-w-0">
        <AdminHeader user={user} onOpenMenu={() => setIsDrawerOpen(true)} />

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <MobileAdminDrawer
        role={user.role}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
