import type { Metadata } from "next";
import { NewsContent } from "@/components/news/NewsContent";

export const metadata: Metadata = {
  title: "أخبار الذهب والاقتصاد",
  description: "آخر أخبار الذهب والدولار والاقتصاد المصري",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "أخبار الذهب والاقتصاد | ذهب مصر",
    description: "آخر أخبار الذهب والدولار والاقتصاد المصري",
    images: ["/api/og?title=أخبار+الذهب&subtitle=آخر+أخبار+الذهب+والاقتصاد&type=news"],
  },
  twitter: {
    card: "summary_large_image",
    title: "أخبار الذهب والاقتصاد | ذهب مصر",
    images: ["/api/og?title=أخبار+الذهب&subtitle=آخر+أخبار+الذهب+والاقتصاد&type=news"],
  },
};

export default function NewsPage() {
  return <NewsContent />;
}
