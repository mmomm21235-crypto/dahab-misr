import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "الرسوم البيانية",
  description: "تتبع حركة أسعار الذهب عبر الزمن",
  openGraph: {
    title: "الرسوم البيانية | ذهب مصر",
    description: "تتبع حركة أسعار الذهب عبر الزمن",
    images: ["/api/og?title=الرسوم+البيانية&subtitle=تتبع+حركة+أسعار+الذهب&type=charts"],
  },
  twitter: {
    card: "summary_large_image",
    title: "الرسوم البيانية | ذهب مصر",
    images: ["/api/og?title=الرسوم+البيانية&subtitle=تتبع+حركة+أسعار+الذهب&type=charts"],
  },
};

const ChartsContent = dynamic(
  () => import("@/components/charts/ChartsContent").then((m) => ({ default: m.ChartsContent })),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="h-10 w-48 shimmer rounded-2xl" />
        <div className="h-12 shimmer rounded-2xl" />
        <div className="h-[300px] shimmer rounded-2xl" />
        <div className="h-[260px] shimmer rounded-2xl" />
      </div>
    ),
  }
);

export default function ChartsPage() {
  return <ChartsContent />;
}
