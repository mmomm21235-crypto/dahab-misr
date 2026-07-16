"use client";

import { useState } from "react";
import { useGoldContext } from "@/context/GoldContext";
import { PriceGrid } from "./PriceGrid";
import { LastUpdateBadge } from "./LastUpdateBadge";
import { QuickStats } from "./QuickStats";
import { MiniChart } from "./MiniChart";
import { HomeStats } from "./HomeStats";
import { NewsPreview } from "./NewsPreview";
import { ShareModal } from "@/components/shared/ShareModal";
import { BannerAd } from "@/components/ads/BannerAd";
import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import Link from "next/link";
import { Calculator, TrendingUp, ChevronLeft, Share2 } from "lucide-react";

export function HomeContent() {
  const { prices, isLoading, error } = useGoldContext();
  const [showShare, setShowShare] = useState(false);

  const shareText = prices
    ? `🔸 أسعار الذهب في مصر الآن:
عيار 24: ${new Intl.NumberFormat("ar-EG").format(prices.karat24.buyPrice)} ج.م
عيار 21: ${new Intl.NumberFormat("ar-EG").format(prices.karat21.buyPrice)} ج.م
عيار 18: ${new Intl.NumberFormat("ar-EG").format(prices.karat18.buyPrice)} ج.م
الجنيه الذهب: ${new Intl.NumberFormat("ar-EG").format(prices.pound.buyPrice)} ج.م
📊 تابع الأسعار لحظة بلحظة عبر تطبيق ذهب مصر`
    : "ذهب مصر - أسعار الذهب لحظة بلحظة";

  return (
    <div className="space-y-6">
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title="ذهب مصر - أسعار الذهب اليوم"
        text={shareText}
        url={typeof window !== "undefined" ? window.location.origin : ""}
      />
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-900 via-gold-800 to-amber-900 p-6 text-white shadow-2xl shadow-gold-900/30">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%,rgba(255,255,255,0.3) 0%,transparent 60%),radial-gradient(circle at 80% 20%,rgba(255,255,255,0.2) 0%,transparent 50%)` }} />
        <div className="relative z-10 animate-fade-in">
          <p className="text-gold-200 text-sm font-medium mb-1">السعر الحالي - عيار ٢١</p>
          {isLoading ? (
            <div className="h-10 w-40 shimmer rounded-xl" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">
                {prices ? new Intl.NumberFormat("ar-EG").format(prices.karat21.buyPrice) : "---"}
              </span>
              <span className="text-xl text-gold-300 font-bold">ج.م</span>
            </div>
          )}
          <p className="text-gold-300 text-xs mt-1">للجرام الواحد</p>
          <div className="flex items-center gap-3 mt-5">
            <Link href="/calculator" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold transition-all duration-200 border border-white/20 hover:border-white/40">
              <Calculator className="w-4 h-4" />
              احسب ذهبك
            </Link>
            <Link href="/charts" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/30">
              <TrendingUp className="w-4 h-4" />
              الرسوم البيانية
            </Link>
            <button onClick={() => setShowShare(true)} aria-label="مشاركة الأسعار" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/30 ms-auto min-h-[44px] min-w-[44px] justify-center">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="absolute -top-8 -end-8 w-40 h-40 rounded-full bg-gold-600/20 blur-2xl animate-pulse-glow" />
        <div className="absolute -bottom-6 -start-6 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="animate-fade-in stagger-1">
        <LastUpdateBadge />
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">
          {error}
        </div>
      )}

      <div className="animate-fade-in stagger-2">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 px-1">إحصائيات سريعة</h2>
        <QuickStats />
      </div>

      <div className="animate-fade-in stagger-3">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 px-1">أسعار جميع العيارات</h2>
        <PriceGrid prices={prices} isLoading={isLoading} />
      </div>

      <div className="animate-fade-in stagger-4">
        <HomeStats />
      </div>

      <BannerAd className="animate-fade-in" />

      <div className="animate-fade-in stagger-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-muted-foreground">حركة الأسعار اليوم</h2>
          <Link href="/charts" className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 font-bold hover:underline">
            عرض الكل <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>
        <MiniChart />
      </div>

      <NativeAdSlot className="animate-fade-in" />

      <div className="gold-card p-5 animate-fade-in stagger-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">آخر الأخبار</h2>
          <Link href="/news" className="text-xs text-gold-600 dark:text-gold-400 font-bold hover:underline">المزيد</Link>
        </div>
        <NewsPreview />
      </div>
    </div>
  );
}
