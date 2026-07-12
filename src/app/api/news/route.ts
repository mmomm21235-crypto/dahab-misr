import { NextResponse } from "next/server";
import { getNews } from "@/lib/db/news";
import { fetchNewsFromAPI } from "@/lib/news-api-service";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const GET = withSecurity(async () => {
  try {
    const apiNews = await fetchNewsFromAPI();
    if (apiNews.length > 0) {
      return NextResponse.json(
        { success: true, data: apiNews, source: "NewsData.io" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            "X-Cache-Source": "api",
          },
        }
      );
    }

    const dbNews = await getNews();
    return NextResponse.json(
      { success: true, data: dbNews, source: "database" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
          "X-Cache-Source": "database",
        },
      }
    );
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}, { rateLimit: "news" });
