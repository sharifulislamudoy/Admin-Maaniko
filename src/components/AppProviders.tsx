"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AdminTextProvider } from "@/context/AdminTextContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminTextProvider>{children}</AdminTextProvider>
    </SessionProvider>
  );
}
