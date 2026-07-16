import type { Metadata } from "next";
import { DownloadContent } from "@/components/download/DownloadContent";

export const metadata: Metadata = {
  title: "تحميل التطبيق",
  description: "حمّل تطبيق ذهب مصر لل_Android - أسعار الذهب لحظة بلحظة",
};

export default function DownloadPage() {
  return <DownloadContent />;
}
