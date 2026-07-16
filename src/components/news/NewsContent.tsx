"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, Newspaper, TrendingUp, DollarSign, Globe, RefreshCw, Search, X } from "lucide-react";
import { MOCK_NEWS } from "@/lib/goldData";
import { cn, CATEGORY_COLORS, CATEGORY_LABELS, formatTimeAgo } from "@/lib/utils";
import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import type { NewsArticle } from "@/types";

const CATEGORIES = [
  { value: "all", label: "الكل", Icon: Globe },
  { value: "gold", label: "الذهب", Icon: TrendingUp },
  { value: "dollar", label: "الدولار", Icon: DollarSign },
  { value: "economy", label: "الاقتصاد", Icon: Newspaper },
];

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.id}`}>
      <div className="gold-card p-4 hover:shadow-lg hover:shadow-gold-500/10 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Category + Time */}
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                  CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.gold
                )}
              >
                {CATEGORY_LABELS[article.category]}
              </span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">{formatTimeAgo(article.date)}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm leading-relaxed group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
              {article.title}
            </h3>

            {/* Summary */}
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground font-medium">
                {article.source}
              </span>
              <div className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                اقرأ المزيد
                <ChevronLeft className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br from-gold-500/20 to-amber-600/10 border border-gold-500/20"
          )}>
            {article.category === "gold" && <TrendingUp className="w-6 h-6 text-gold-500" />}
            {article.category === "dollar" && <DollarSign className="w-6 h-6 text-blue-500" />}
            {article.category === "economy" && <Newspaper className="w-6 h-6 text-purple-500" />}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function NewsContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles] = useState<NewsArticle[]>(MOCK_NEWS);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<string>("mock");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setArticles(data.data);
          setSource(data.source || "api");
        }
      } catch {
        // keep MOCK_NEWS fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  const filtered = articles.filter((n) => {
    const matchesCategory = activeCategory === "all" || n.category === activeCategory;
    const matchesSearch = !searchQuery || 
      n.title.includes(searchQuery) || 
      n.summary.includes(searchQuery) || 
      n.source.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <Newspaper className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-black text-lg">الأخبار</h1>
          <p className="text-xs text-muted-foreground">
            آخر أخبار الذهب والاقتصاد
            {source === "NewsData.io" && (
              <span className="text-green-600 dark:text-green-400 mr-1">● مباشرة</span>
            )}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200",
              "border flex-shrink-0",
              activeCategory === value
                ? "bg-gold-500/10 border-gold-500/30 text-gold-600 dark:text-gold-400"
                : "bg-muted/50 border-border text-muted-foreground hover:border-gold-500/30"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في الأخبار..."
          className="w-full ps-10 pe-10 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-gold-500 transition-colors text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-gold-500" />
          <span className="text-sm text-muted-foreground ms-2">جاري تحميل الأخبار...</span>
        </div>
      )}

      {/* News List */}
      {!isLoading && (
        <div className="space-y-3">
          {filtered.map((article, i) => (
            <Fragment key={article.id}>
              <div
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <NewsCard article={article} />
              </div>
              {(i + 1) % 3 === 0 && i < filtered.length - 1 && (
                <NativeAdSlot className="animate-fade-in" />
              )}
            </Fragment>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">لا توجد أخبار في هذا القسم حالياً</p>
        </div>
      )}
    </div>
  );
}
