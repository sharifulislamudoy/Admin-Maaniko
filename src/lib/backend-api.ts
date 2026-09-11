import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";

async function getBackendToken(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return token?.backendAccessToken ?? null;
}

export async function backendRequest(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const accessToken = await getBackendToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${env.backendUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
      cache: "no-store",
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Backend is unavailable" },
      { status: 502 },
    );
  }
}
