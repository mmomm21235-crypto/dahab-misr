import type { NewsArticle } from "@/types";

interface NewsDataArticle {
  title: string;
  description: string | null;
  content: string | null;
  link: string;
  image_url: string | null;
  pubDate: string;
  source_name: string;
}

interface NewsDataResponse {
  status: string;
  results: NewsDataArticle[];
  nextPage?: string;
}

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  gold: /ذهب|gold|عيار|karat|ذهبية/i,
  dollar: /دولار|dollar|USD|عملة|currency|صرف/i,
  economy: /اقتصاد|economy|بنك|bank|فائدة|interest|تضخم|inflation|بورصة|stock/i,
};

function detectCategory(title: string, description: string): "gold" | "dollar" | "economy" {
  for (const [cat, regex] of Object.entries(CATEGORY_KEYWORDS)) {
    if (regex.test(title) || regex.test(description)) {
      return cat as "gold" | "dollar" | "economy";
    }
  }
  return "economy";
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoffMs = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 && attempt < retries) {
        const retryAfter = res.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : backoffMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function fetchNewsFromAPI(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_DATA_API_KEY;

  if (!apiKey) {
    console.warn("NEWS_DATA_API_KEY not configured (get free key at newsdata.io)");
    return [];
  }

  try {
    const queries = [
      "ذهب مصر",
      "gold price egypt",
      "الاقتصاد المصري",
      "دولار جنيه",
    ];

    const allArticles: NewsArticle[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      const res = await fetchWithRetry(
        `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=ar&country=eg&category=business&size=10`,
        { next: { revalidate: 300, tags: ["news"] } }
      );

      if (!res.ok) {
        console.warn(`NewsData.io responded with ${res.status} for query: ${q}`);
        continue;
      }

      const data: NewsDataResponse = await res.json();
      if (data.status !== "success" || !data.results) continue;

      for (const article of data.results) {
        if (!article.title) continue;
        const id = article.title.slice(0, 50);
        if (seen.has(id)) continue;
        seen.add(id);

        allArticles.push({
          id: `news-${allArticles.length + 1}`,
          title: article.title,
          summary: article.description || article.title,
          content: article.content || article.description || article.title,
          category: detectCategory(article.title, article.description || ""),
          source: article.source_name || "غير معروف",
          date: article.pubDate || new Date().toISOString(),
          imageUrl: article.image_url ?? undefined,
          url: article.link,
        });
      }
    }

    return allArticles.slice(0, 20);
  } catch (err) {
    console.error("NewsData.io fetch failed:", err);
    return [];
  }
}
