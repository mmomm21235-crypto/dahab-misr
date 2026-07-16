import { prisma } from "./prisma";
import type { NewsArticle } from "@/types";

export async function getNews(): Promise<NewsArticle[]> {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (articles.length === 0) {
      const { MOCK_NEWS } = await import("@/lib/goldData");
      return MOCK_NEWS;
    }

    return articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      content: a.content,
      category: a.category.toLowerCase() as NewsArticle["category"],
      source: a.source,
      date: a.createdAt.toISOString(),
      imageUrl: a.imageUrl ?? undefined,
      url: a.url ?? undefined,
    }));
  } catch {
    const { MOCK_NEWS } = await import("@/lib/goldData");
    return MOCK_NEWS;
  }
}

export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article) {
      const { MOCK_NEWS } = await import("@/lib/goldData");
      return MOCK_NEWS.find((n) => n.id === id) ?? null;
    }

    return {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category.toLowerCase() as NewsArticle["category"],
      source: article.source,
      date: article.createdAt.toISOString(),
      imageUrl: article.imageUrl ?? undefined,
      url: article.url ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function seedNews() {
  const count = await prisma.newsArticle.count();
  if (count > 0) return;

  const { MOCK_NEWS } = await import("@/lib/goldData");
  await prisma.newsArticle.createMany({
    data: MOCK_NEWS.map((n) => ({
      title: n.title,
      summary: n.summary,
      content: n.content,
      category: n.category.toUpperCase() as "GOLD" | "DOLLAR" | "ECONOMY",
      source: n.source,
      createdAt: new Date(n.date),
    })),
  });
}
