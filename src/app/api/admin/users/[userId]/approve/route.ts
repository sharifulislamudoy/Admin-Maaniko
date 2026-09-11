import type { NextRequest } from "next/server";

import { backendRequest } from "@/lib/backend-api";

type UserRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PUT(request: NextRequest, context: UserRouteContext) {
  const { userId } = await context.params;

  return backendRequest(
    request,
    `/admin/approve/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
    },
  );
}
