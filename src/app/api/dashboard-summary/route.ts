import type { NextRequest } from "next/server";

import { backendRequest } from "@/lib/backend-api";

export function GET(request: NextRequest) {
  return backendRequest(request, "/admin/dashboard/summary");
}