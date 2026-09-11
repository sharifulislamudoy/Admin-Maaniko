import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendRequest } from "@/lib/backend-api";

const ALLOWED = new Set([
  "products",
  "combos",
  "banners",
  "guides",
  "guide-categories",
  "guide-page",
]);

type RouteContext = {
  params: Promise<{ resource: string; id?: string[] }>;
};

async function forward(
  request: NextRequest,
  context: RouteContext,
  method: string,
) {
  const { resource, id } = await context.params;
  if (!ALLOWED.has(resource)) {
    return NextResponse.json(
      { message: "Unknown catalog resource" },
      { status: 404 },
    );
  }
  const suffix = id?.length
    ? `/${id.map((part) => encodeURIComponent(part)).join("/")}`
    : "/admin/all";
  const body =
    method === "GET" || method === "DELETE" ? undefined : await request.text();
  return backendRequest(request, `/${resource}${suffix}`, {
    method,
    body,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
}

export const GET = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "GET");
export const POST = async (request: NextRequest, context: RouteContext) => {
  const { resource } = await context.params;
  if (!ALLOWED.has(resource))
    return NextResponse.json(
      { message: "Unknown catalog resource" },
      { status: 404 },
    );
  return backendRequest(request, `/${resource}`, {
    method: "POST",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
};
export const PATCH = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "PATCH");
export const DELETE = (request: NextRequest, context: RouteContext) =>
  forward(request, context, "DELETE");
