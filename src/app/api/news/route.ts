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
        { success: true, data: apiNews },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    const dbNews = await getNews();
    return NextResponse.json(
      { success: true, data: dbNews },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}, { rateLimit: "news" });
