import type { Metadata } from "next";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const metadata: Metadata = {
  title: "الإعدادات",
  description: "تخصيص تطبيق ذهب مصر",
};

export default function SettingsPage() {
  return <SettingsContent />;
}
