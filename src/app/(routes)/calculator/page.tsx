import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "حاسبة الذهب",
  description: "احسب قيمة ذهبك بسهولة - شراء وبيع جميع العيارات",
  openGraph: {
    title: "حاسبة الذهب | ذهب مصر",
    description: "احسب قيمة ذهبك بسهولة - شراء وبيع جميع العيارات",
    images: ["/api/og?title=حاسبة+الذهب&subtitle=احسب+قيمة+ذهبك+بسهولة&type=calculator"],
  },
  twitter: {
    card: "summary_large_image",
    title: "حاسبة الذهب | ذهب مصر",
    images: ["/api/og?title=حاسبة+الذهب&subtitle=احسب+قيمة+ذهبك+بسهولة&type=calculator"],
  },
};

const GoldCalculator = dynamic(
  () => import("@/components/calculator/GoldCalculator").then((m) => ({ default: m.GoldCalculator })),
  { loading: () => <div className="space-y-6 animate-pulse"><div className="h-64 rounded-2xl bg-muted/50" /></div> }
);

export default function CalculatorPage() {
  return <GoldCalculator />;
}
