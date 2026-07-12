import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsById } from "@/lib/db/news";
import { MOCK_NEWS } from "@/lib/goldData";
import { NewsDetailContent } from "@/components/news/NewsDetailContent";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsById(id) ?? MOCK_NEWS.find((n) => n.id === id);
  if (!article) return { title: "الخبر غير موجود" };
  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getNewsById(id) ?? MOCK_NEWS.find((n) => n.id === id);
  if (!article) notFound();
  return <NewsDetailContent article={article} />;
}
