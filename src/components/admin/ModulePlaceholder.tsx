"use client";

import { Construction } from "lucide-react";
import { useAdminText } from "@/context/AdminTextContext";

export default function ModulePlaceholder({ titleKey }: { titleKey: string }) {
  const { t } = useAdminText();
  return (
    <div className="rounded-3xl border border-[#dce3ec] bg-white p-8 shadow-[0_12px_40px_rgba(6,42,84,0.06)]">
      <span className="grid size-14 place-items-center rounded-2xl bg-[#10a9e8]/10 text-[#10a9e8]">
        <Construction className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-black text-[#062a54]">{t(titleKey)}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {t("admin.common.comingSoon")}
      </p>
    </div>
  );
}
