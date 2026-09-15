import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get("days") ?? "30";
  return backendRequest(
    request,
    `/ai-assistant/admin/analytics?days=${encodeURIComponent(days)}`,
  );
}
