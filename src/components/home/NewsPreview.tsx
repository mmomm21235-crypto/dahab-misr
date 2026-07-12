"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, DollarSign, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
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

function formatTimeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function NewsPreview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setArticles(data.data.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  if (articles.length === 0) return null;

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
