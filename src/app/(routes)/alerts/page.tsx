import type { Metadata } from "next";
import { AlertsPageClient } from "@/components/alerts/AlertsPageClient";

export const metadata: Metadata = {
  title: "تنبيهات الأسعار",
  description: "اضبط تنبيهاتك وكن أول من يعلم بتغيرات أسعار الذهب",
};

export default function AlertsPage() {
  return <AlertsPageClient />;
}
