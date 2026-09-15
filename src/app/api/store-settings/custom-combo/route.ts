import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export const GET = (request: NextRequest) =>
  backendRequest(request, "/store-settings/admin/custom-combo");

export async function PATCH(request: NextRequest) {
  return backendRequest(request, "/store-settings/admin/custom-combo", {
    method: "PATCH",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
}
