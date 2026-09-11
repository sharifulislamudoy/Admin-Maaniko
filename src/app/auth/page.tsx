import { redirect } from "next/navigation";

import AuthCard from "@/components/auth/AuthCard";
import { auth } from "@/lib/auth";

type AuthPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    error?: string | string[];
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (session?.user && session.user.status === "APPROVED") {
    redirect("/");
  }

  const statusValue = params.status ?? params.error;

  const status = Array.isArray(statusValue) ? statusValue[0] : statusValue;

  return <AuthCard status={status} />;
}
