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
    alternates: { canonical: `/news/${article.id}` },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: "date" in article ? article.date : undefined,
      images: article.imageUrl ? [article.imageUrl] : ["/api/og?title=" + encodeURIComponent(article.title) + "&type=news"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getNewsById(id) ?? MOCK_NEWS.find((n) => n.id === id);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: "date" in article ? article.date : undefined,
    author: {
      "@type": "Organization",
      name: article.source || "ذهب مصر",
    },
    publisher: {
      "@type": "Organization",
      name: "ذهب مصر",
      logo: {
        "@type": "ImageObject",
        url: "https://dahab-misr.vercel.app/icons/icon-192x192.png",
      },
    },
    image: article.imageUrl || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://dahab-misr.vercel.app/news/${article.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailContent article={article} />
    </>
  );
}
