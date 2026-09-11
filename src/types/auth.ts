export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export type AdminStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BackendUser = {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ManagedAdmin = {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: string;
  updatedAt?: string;
};

export type PendingUser = Pick<BackendUser, "id" | "name" | "email"> & {
  createdAt: string;
};
