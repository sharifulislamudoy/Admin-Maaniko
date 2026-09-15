"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  X,
} from "lucide-react";

import { useAdminText } from "@/context/AdminTextContext";
import type { AdminStatus, ManagedAdmin } from "@/types/auth";

type AdminAction = "approve" | "reject" | "delete";

type ConfirmationState = {
  user: ManagedAdmin;
  action: AdminAction;
} | null;

const statusStyles: Record<AdminStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
};

const confirmButtonStyles: Record<AdminAction, string> = {
  approve: "bg-[#062a54] text-white hover:bg-[#0a3b72]",
  reject: "bg-rose-600 text-white hover:bg-rose-700",
  delete: "bg-rose-600 text-white hover:bg-rose-700",
};

const actionLabelKeys: Record<AdminAction, string> = {
  approve: "admin.actions.approve",
  reject: "admin.actions.reject",
  delete: "admin.actions.delete",
};

const actionLoadingKeys: Record<AdminAction, string> = {
  approve: "admin.actions.approving",
  reject: "admin.actions.rejecting",
  delete: "admin.actions.deleting",
};

const actionSuccessKeys: Record<AdminAction, string> = {
  approve: "admin.management.approved",
  reject: "admin.management.rejected",
  delete: "admin.management.deleted",
};

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export default function AdminManagement({ allowed }: { allowed: boolean }) {
  const { t, locale } = useAdminText();

  const [users, setUsers] = useState<ManagedAdmin[]>([]);
  const [loading, setLoading] = useState(allowed);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadUsers = useCallback(async () => {
    if (!allowed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const body = (await response.json().catch(() => null)) as
        ManagedAdmin[] | { message?: string | string[] } | null;

      if (!response.ok) {
        const responseMessage =
          body && !Array.isArray(body) && Array.isArray(body.message)
            ? body.message.join(" ")
            : body && !Array.isArray(body) && typeof body.message === "string"
              ? body.message
              : t("admin.management.loadError");

        throw new Error(responseMessage);
      }

      setUsers(Array.isArray(body) ? body : []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("admin.management.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [allowed, t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (!confirmation) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !working) {
        setConfirmation(null);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [confirmation, working]);

  const counts = useMemo(() => {
    return users.reduce(
      (result, user) => {
        result.total += 1;

        if (user.status === "APPROVED") {
          result.approved += 1;
        }

        if (user.status === "PENDING") {
          result.pending += 1;
        }

        if (user.status === "REJECTED") {
          result.rejected += 1;
        }

        return result;
      },
      {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      },
    );
  }, [users]);

  function closeConfirmation() {
    if (working) return;
    setConfirmation(null);
  }

  async function performConfirmedAction() {
    if (!confirmation || working) return;

    const { user, action } = confirmation;

    if (user.role === "SUPER_ADMIN") {
      setConfirmation(null);
      return;
    }

    setWorking(true);
    setError("");
    setToast("");

    const endpoint =
      action === "delete"
        ? `/api/admin/users/${encodeURIComponent(user.id)}`
        : `/api/admin/users/${encodeURIComponent(user.id)}/${action}`;

    try {
      const response = await fetch(endpoint, {
        method: action === "delete" ? "DELETE" : "PUT",
      });

      const body = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;

      if (!response.ok) {
        const responseMessage = Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message;

        throw new Error(responseMessage || t("admin.management.loadError"));
      }

      if (action === "delete") {
        setUsers((currentUsers) =>
          currentUsers.filter((currentUser) => currentUser.id !== user.id),
        );
      } else {
        const nextStatus: AdminStatus =
          action === "approve" ? "APPROVED" : "REJECTED";

        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser.id === user.id
              ? {
                  ...currentUser,
                  status: nextStatus,
                }
              : currentUser,
          ),
        );
      }

      setConfirmation(null);
      setToast(t(actionSuccessKeys[action]));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("admin.management.loadError"),
      );
    } finally {
      setWorking(false);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("bn-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />

          <p className="text-sm font-bold leading-6">
            {t("admin.management.forbidden")}
          </p>
        </div>
      </div>
    );
  }

  const confirmationName =
    confirmation?.user.name || confirmation?.user.email || "";

  const confirmationTitle = confirmation
    ? t(`admin.management.confirm.${confirmation.action}.title`)
    : "";

  const confirmationDescription = confirmation
    ? t(`admin.management.confirm.${confirmation.action}.description`, {
        name: confirmationName,
      })
    : "";

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#10a9e8]">
              {t("admin.management.eyebrow")}
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#062a54] sm:text-3xl">
              {t("admin.management.title")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t("admin.management.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#dce3ec] bg-white px-4 text-sm font-extrabold text-[#062a54] transition hover:border-[#10a9e8] hover:bg-[#f3fbff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />

            {t("admin.actions.refresh")}
          </button>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label={t("admin.management.totalAdmins")}
            value={counts.total}
            icon={UserRound}
            color="bg-[#062a54]/10 text-[#062a54]"
          />

          <SummaryCard
            label={t("admin.management.approvedAdmins")}
            value={counts.approved}
            icon={UserCheck}
            color="bg-emerald-100 text-emerald-700"
          />

          <SummaryCard
            label={t("admin.management.pendingAdmins")}
            value={counts.pending}
            icon={ShieldCheck}
            color="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            label={t("admin.management.rejectedAdmins")}
            value={counts.rejected}
            icon={UserX}
            color="bg-rose-100 text-rose-700"
          />
        </section>

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="admin-error"
              initial={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="overflow-hidden rounded-3xl border border-[#dce3ec] bg-white shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
          {loading ? (
            <AdminTableSkeleton />
          ) : users.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eef3f8] text-[#062a54]">
                  <UserRound className="size-7" />
                </span>

                <p className="mt-4 text-sm font-bold text-slate-500">
                  {t("admin.management.empty")}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#f8fafc] text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">{t("admin.management.admin")}</th>

                    <th className="px-6 py-4">{t("admin.management.role")}</th>

                    <th className="px-6 py-4">
                      {t("admin.management.status")}
                    </th>

                    <th className="px-6 py-4">
                      {t("admin.management.joined")}
                    </th>

                    <th className="px-6 py-4 text-right">
                      {t("admin.management.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf1f5]">
                  {users.map((user) => {
                    const isSuperAdmin = user.role === "SUPER_ADMIN";

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-[#fff8fa]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0f5] text-sm font-black text-[#ef4277]">
                              {getInitials(user.name, user.email)}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[#062a54]">
                                {user.name || "Google User"}
                              </p>

                              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${
                              isSuperAdmin
                                ? "bg-[#eef3f8] text-[#062a54] ring-[#cbd7e4]"
                                : "bg-sky-50 text-sky-700 ring-sky-200"
                            }`}
                          >
                            {t(
                              isSuperAdmin
                                ? "admin.role.superAdmin"
                                : "admin.role.admin",
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${
                              statusStyles[user.status]
                            }`}
                          >
                            {t(`admin.status.${user.status.toLowerCase()}`)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          {isSuperAdmin ? (
                            <div className="flex justify-end">
                              <span className="inline-flex items-center gap-2 rounded-xl bg-[#eef3f8] px-3 py-2 text-xs font-extrabold text-[#062a54]">
                                <ShieldCheck className="size-4" />

                                {t("admin.management.superAdminProtected")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {user.status !== "APPROVED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmation({
                                      user,
                                      action: "approve",
                                    })
                                  }
                                  title={t("admin.actions.approve")}
                                  className="grid size-10 place-items-center rounded-xl border border-emerald-200 text-emerald-600 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 active:translate-y-0"
                                >
                                  <Check className="size-4" />
                                </button>
                              )}

                              {user.status !== "REJECTED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmation({
                                      user,
                                      action: "reject",
                                    })
                                  }
                                  title={t("admin.actions.reject")}
                                  className="grid size-10 place-items-center rounded-xl border border-rose-200 text-rose-600 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-0"
                                >
                                  <UserX className="size-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmation({
                                    user,
                                    action: "delete",
                                  })
                                }
                                title={t("admin.actions.delete")}
                                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:translate-y-0"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            key={`${confirmation.user.id}-${confirmation.action}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="fixed inset-0 z-[60] grid place-items-center p-4"
          >
            <button
              type="button"
              aria-label={t("admin.actions.cancel")}
              disabled={working}
              onClick={closeConfirmation}
              className="absolute inset-0 cursor-default bg-[#031a35]/60 backdrop-blur-sm disabled:cursor-not-allowed"
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-confirmation-title"
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.96,
              }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-white bg-white p-6 shadow-[0_30px_90px_rgba(6,42,84,0.25)] sm:p-7"
            >
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={working}
                aria-label={t("admin.actions.cancel")}
                className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-slate-400 transition duration-200 hover:rotate-90 hover:bg-slate-100 hover:text-[#062a54] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-5" />
              </button>

              <motion.span
                initial={{
                  opacity: 0,
                  scale: 0.6,
                  rotate: -12,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  delay: 0.08,
                  type: "spring",
                  stiffness: 450,
                  damping: 24,
                }}
                className={`grid size-14 place-items-center rounded-2xl ${
                  confirmation.action === "approve"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {confirmation.action === "approve" ? (
                  <UserCheck className="size-7" />
                ) : confirmation.action === "reject" ? (
                  <UserX className="size-7" />
                ) : (
                  <Trash2 className="size-7" />
                )}
              </motion.span>

              <h2
                id="admin-confirmation-title"
                className="mt-5 pr-10 text-xl font-black text-[#062a54]"
              >
                {confirmationTitle}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {confirmationDescription}
              </p>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={working}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dce3ec] px-5 text-sm font-extrabold text-slate-600 transition duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("admin.actions.cancel")}
                </button>

                <button
                  type="button"
                  onClick={() => void performConfirmedAction()}
                  disabled={working}
                  className={`inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${
                    confirmButtonStyles[confirmation.action]
                  }`}
                >
                  {working && <LoaderCircle className="size-4 animate-spin" />}

                  {t(
                    working
                      ? actionLoadingKeys[confirmation.action]
                      : actionLabelKeys[confirmation.action],
                  )}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            aria-live="polite"
            initial={{
              opacity: 0,
              x: 50,
              y: 16,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: 50,
              y: 12,
              scale: 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              mass: 0.8,
            }}
            className="fixed bottom-5 right-5 z-[70] w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-[0_20px_60px_rgba(6,42,84,0.18)]"
          >
            <div className="flex items-start gap-3 p-4">
              <motion.span
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 24,
                }}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100"
              >
                <Check className="size-5" />
              </motion.span>

              <p className="min-w-0 flex-1 pt-1 text-sm font-bold leading-6">
                {toast}
              </p>

              <button
                type="button"
                onClick={() => setToast("")}
                aria-label={t("admin.actions.cancel")}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition duration-200 hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: 3.5,
                ease: "linear",
              }}
              className="h-1 origin-left bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof UserRound;
  color: string;
};

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-[#dce3ec] bg-white p-5 shadow-[0_10px_35px_rgba(6,42,84,0.05)]">
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>

        <p className="mt-1 text-2xl font-black text-[#062a54]">{value}</p>
      </div>

      <span className={`grid size-12 place-items-center rounded-2xl ${color}`}>
        <Icon className="size-6" />
      </span>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-14 bg-slate-50" />

      <div className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="size-11 rounded-2xl bg-slate-200" />
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="ml-auto h-9 w-44 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
