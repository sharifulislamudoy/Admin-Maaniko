import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export const GET = (request: NextRequest) =>
  backendRequest(request, "/content-pages/admin/all");
