import AdminManagement from "@/components/admin/AdminManagement";
import { auth } from "@/lib/auth";

export default async function AdminManagementPage() {
  const session = await auth();
  return <AdminManagement allowed={session?.user.role === "SUPER_ADMIN"} />;
}
