import type { NextRequest } from "next/server";

import { backendRequest } from "@/lib/backend-api";

type UserRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function DELETE(request: NextRequest, context: UserRouteContext) {
  const { userId } = await context.params;

  return backendRequest(request, `/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}
