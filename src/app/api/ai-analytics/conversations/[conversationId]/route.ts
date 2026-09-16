import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  return context.params.then(({ conversationId }) =>
    backendRequest(
      request,
      `/ai-assistant/admin/conversations/${encodeURIComponent(conversationId)}`,
    ),
  );
}
