import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";

export const metadata: Metadata = {
  title: "أسعار الذهب اليوم في مصر",
  description:
    "تابع أسعار الذهب في مصر لحظة بلحظة - عيار 24، 21، 18 والجنيه الذهب",
};

export default function HomePage() {
  return <HomeContent />;
}
