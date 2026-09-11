import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { AdminRole, AdminStatus, BackendUser } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      status: AdminStatus;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    backendAccessToken?: string;
    backendUser?: BackendUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: AdminRole;
    status?: AdminStatus;
    backendAccessToken?: string;
  }
}
