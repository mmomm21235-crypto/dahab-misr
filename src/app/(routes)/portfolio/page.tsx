import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "محفظتي",
  description: "تتبع استثماراتك في الذهب - سعر الشراء والقيمة الحالية والربح والخسارة",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "محفظتي | ذهب مصر",
    description: "تتبع استثماراتك في الذهب - سعر الشراء والقيمة الحالية والربح والخسارة",
    images: ["/api/og?title=محفظتي&subtitle=تتبع+استثماراتك+في+الذهب&type=portfolio"],
  },
  twitter: {
    card: "summary_large_image",
    title: "محفظتي | ذهب مصر",
    images: ["/api/og?title=محفظتي&subtitle=تتبع+استثماراتك+في+الذهب&type=portfolio"],
  },
};

const PortfolioContent = dynamic(
  () => import("@/components/portfolio/PortfolioContent").then((m) => ({ default: m.PortfolioContent })),
  { loading: () => <div className="space-y-5 animate-pulse"><div className="h-40 rounded-2xl bg-muted/50" /><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted/30" />)}</div></div> }
);

export default function PortfolioPage() {
  return <PortfolioContent />;
}
