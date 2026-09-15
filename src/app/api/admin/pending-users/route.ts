import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  return backendRequest(request, "/admin/pending-users");
}
