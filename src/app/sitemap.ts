import type { MetadataRoute } from "next";

const BASE_URL = "https://dahab-misr.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/calculator`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/charts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/alerts`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/shops`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic news pages
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const articles = await prisma.newsArticle.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const newsPages: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${BASE_URL}/news/${article.id}`,
      lastModified: article.createdAt.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...newsPages];
  } catch {
    return staticPages;
  }
}
