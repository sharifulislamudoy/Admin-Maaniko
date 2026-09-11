import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { auth } from "@/lib/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.status !== "APPROVED") {
    redirect(`/auth?status=${session.user.status}`);
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
