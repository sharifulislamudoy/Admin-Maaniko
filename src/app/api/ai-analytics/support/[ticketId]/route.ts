import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await context.params;
  return backendRequest(
    request,
    `/ai-assistant/admin/support/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
