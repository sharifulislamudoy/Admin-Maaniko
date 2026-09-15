import type { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const { path } = await context.params;
  const safePath = path.map((part) => encodeURIComponent(part)).join("/");

  const query = request.nextUrl.searchParams.toString();
  const backendPath = `/commerce/admin/${safePath}${query ? `?${query}` : ""}`;
  const body =
    method === "GET" || method === "DELETE" ? undefined : await request.text();

  return backendRequest(request, backendPath, {
    method,
    body,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
}

export const GET = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "GET");

export const POST = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "POST");

export const PATCH = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "PATCH");

export const DELETE = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "DELETE");
