import type { Metadata } from "next";
import GuideManager from "@/components/guides/GuideManager";

export const metadata: Metadata = { title: "গাইড পরিচালনা" };
export default function GuidesAdminPage() {
  return <GuideManager />;
}
