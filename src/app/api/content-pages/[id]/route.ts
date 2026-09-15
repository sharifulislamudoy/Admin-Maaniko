import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return backendRequest(request, `/content-pages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
}
