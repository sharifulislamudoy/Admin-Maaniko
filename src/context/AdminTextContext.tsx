"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { adminText, DEFAULT_LOCALE } from "@/content/admin-copy";
import type {
  AdminTextContextValue,
  AdminTextProviderProps,
  TextInput,
} from "@/types/admin-text";
import { resolveText } from "@/types/admin-text";

const AdminTextContext = createContext<AdminTextContextValue | null>(null);

function readText(key: string) {
  let current: unknown = adminText;
  for (const part of key.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

function interpolate(template: string, options?: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    options?.[key] == null ? "" : String(options[key]),
  );
}

export function AdminTextProvider({ children }: AdminTextProviderProps) {
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      interpolate(readText(key), options),
    [],
  );
  const text = useCallback(
    (value: TextInput, fallback = "") => resolveText(value, DEFAULT_LOCALE, fallback),
    [],
  );
  const contextValue = useMemo<AdminTextContextValue>(
    () => ({ locale: DEFAULT_LOCALE, t, text }),
    [t, text],
  );
  return (
    <AdminTextContext.Provider value={contextValue}>
      {children}
    </AdminTextContext.Provider>
  );
}

export function useAdminText() {
  const context = useContext(AdminTextContext);
  if (!context) throw new Error("useAdminText must be used inside AdminTextProvider.");
  return context;
}
