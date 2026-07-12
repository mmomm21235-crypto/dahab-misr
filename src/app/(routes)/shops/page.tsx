import type { Metadata } from "next";
import { ShopsContent } from "@/components/shops/ShopsContent";

export const metadata: Metadata = {
  title: "دليل محلات الذهب",
  description: "أكبر دليل لمحلات الذهب في مصر — اعثر على أقرب محل لشراء أو بيع الذهب",
};

export default function ShopsPage() {
  return <ShopsContent />;
}
