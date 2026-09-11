import type { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/lib/env";
import type { BackendUser } from "@/types/auth";

type LoginResponse = { access_token: string };

function statusRedirect(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("pending") || normalized.includes("অপেক্ষ")) {
    return "/auth?status=pending";
  }
  if (normalized.includes("reject") || normalized.includes("প্রত্যাখ")) {
    return "/auth?status=rejected";
  }
  return "/auth?status=server-error";
}

async function readMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? response.statusText;
}

async function connectGoogleToBackend(idToken: string): Promise<{
  accessToken: string;
  user: BackendUser;
}> {
  const loginResponse = await fetch(`${env.backendUrl}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });

  if (!loginResponse.ok) {
    throw new Error(await readMessage(loginResponse));
  }

  const login = (await loginResponse.json()) as LoginResponse;
  if (!login.access_token) throw new Error("Backend access token পাওয়া যায়নি");

  const profileResponse = await fetch(`${env.backendUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${login.access_token}` },
    cache: "no-store",
  });

  if (!profileResponse.ok) throw new Error(await readMessage(profileResponse));

  return {
    accessToken: login.access_token,
    user: (await profileResponse.json()) as BackendUser,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      authorization: {
        params: {
          prompt: "select_account",
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;
      if (!account.id_token) return "/auth?status=missing-token";

      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (googleProfile?.email_verified === false)
        return "/auth?status=oauth-error";

      try {
        const backend = await connectGoogleToBackend(account.id_token);
        const sessionUser = user as User;
        sessionUser.backendAccessToken = backend.accessToken;
        sessionUser.backendUser = backend.user;
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Backend login করা যায়নি";
        return statusRedirect(message);
      }
    },
    async jwt({ token, user }) {
      if (user?.backendAccessToken && user.backendUser) {
        token.backendAccessToken = user.backendAccessToken;
        token.userId = user.backendUser.id;
        token.role = user.backendUser.role;
        token.status = user.backendUser.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.role = token.role ?? "ADMIN";
        session.user.status = token.status ?? "PENDING";
      }
      return session;
    },
  },
};
