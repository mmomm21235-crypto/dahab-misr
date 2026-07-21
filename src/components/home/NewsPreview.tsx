"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, DollarSign, Newspaper } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { NewsArticle } from "@/types";

const ICONS: Record<string, typeof TrendingUp> = {
  gold: TrendingUp,
  dollar: DollarSign,
  economy: Newspaper,
};

const ICON_COLORS: Record<string, string> = {
  gold: "text-gold-500",
  dollar: "text-blue-500",
  economy: "text-purple-500",
};

export function NewsPreview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setArticles(data.data.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/50 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        لا توجد أخبار متاحة حالياً
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const Icon = ICONS[article.category] ?? Newspaper;
        return (
          <Link key={article.id} href={`/news/${article.id}`}>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 transition-all hover:bg-muted/80 cursor-pointer group">
              <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", ICON_COLORS[article.category] ?? "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-relaxed group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatTimeAgo(article.date)} · {article.source}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
