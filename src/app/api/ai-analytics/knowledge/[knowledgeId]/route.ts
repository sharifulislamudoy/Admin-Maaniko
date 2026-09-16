import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ knowledgeId: string }> },
) {
  const { knowledgeId } = await context.params;
  return backendRequest(
    request,
    `/ai-assistant/admin/knowledge/${encodeURIComponent(knowledgeId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
