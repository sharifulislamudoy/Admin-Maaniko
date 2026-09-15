import type { ReactNode } from "react";

export type ContentText = string;
export type TextInput = string | null | undefined;

export type AdminTextContextValue = {
  locale: "en-US";
  t: (key: string, options?: Record<string, unknown>) => string;
  text: (value: TextInput, fallback?: string) => string;
};

export type AdminTextProviderProps = {
  children: ReactNode;
};

export function resolveText(
  value: TextInput,
  _locale: "en-US",
  fallback = "",
): string {
  return value?.trim() || fallback;
}
