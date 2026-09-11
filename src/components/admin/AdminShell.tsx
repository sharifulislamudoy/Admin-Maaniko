"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-[#f8fafc] xl:grid xl:grid-cols-4">
      <aside className="hidden xl:block">
        <AdminSidebar role={user.role} />
      </aside>

      <div className="min-w-0 xl:col-span-3">
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
