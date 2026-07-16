"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Share2, TrendingUp, DollarSign, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/types";
import { cn, formatDate, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/utils";
import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { BannerAd } from "@/components/ads/BannerAd";
import { toast } from "sonner";

interface Props {
  article: NewsArticle;
}

export function NewsDetailContent({ article }: Props) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("تم نسخ الرابط");
      }
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/news"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للأخبار
        </Link>
        <button
          onClick={handleShare}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium",
            "bg-muted hover:bg-accent transition-colors"
          )}
        >
          <Share2 className="w-4 h-4" />
          مشاركة
        </button>
      </div>

      {/* Article */}
      <article className="gold-card p-5 space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border",
              CATEGORY_COLORS[article.category]
            )}
          >
            {CATEGORY_LABELS[article.category]}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatDate(article.date)}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-black leading-relaxed">{article.title}</h1>

        {/* Summary */}
        <p className="text-base text-muted-foreground leading-loose font-medium border-s-4 border-gold-500 ps-4">
          {article.summary}
        </p>

        {/* Icon Banner */}
        <div className={cn(
          "w-full h-32 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-gold-500/10 to-amber-600/5 border border-gold-500/20"
        )}>
          {article.category === "gold" && <TrendingUp className="w-16 h-16 text-gold-500/40" />}
          {article.category === "dollar" && <DollarSign className="w-16 h-16 text-blue-500/40" />}
          {article.category === "economy" && <Newspaper className="w-16 h-16 text-purple-500/40" />}
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          {article.content.split("\n\n").map((paragraph, i, arr) => (
            <Fragment key={i}>
              <p
                className="text-sm leading-loose text-foreground/90 mb-4 last:mb-0"
              >
                {paragraph}
              </p>
              {(i + 1) % 3 === 0 && i < arr.length - 1 && (
                <NativeAdSlot className="my-4" />
              )}
            </Fragment>
          ))}
        </div>

        <BannerAd className="mt-4" />

        {/* Source */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            المصدر: <span className="font-bold">{article.source}</span>
          </p>
          <div className="flex items-center gap-3">
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                المصدر الأصلي ↗
              </a>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-gold-600 dark:text-gold-400 font-bold hover:underline"
            >
              <Share2 className="w-3 h-3" />
              مشاركة الخبر
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
