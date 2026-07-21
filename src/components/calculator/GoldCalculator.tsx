"use client";

import { useState, useEffect, useMemo } from "react";
import { Info, Scale, BadgePercent, Coins, Gem, DollarSign, TrendingUp, TrendingDown, History } from "lucide-react";
import { useGoldContext } from "@/context/GoldContext";
import { formatCurrency, formatPrice, cn } from "@/lib/utils";

const KARATS = [24, 21, 18, 14];
const GRAMS = [1, 5, 10, 21, 50];
const CRAFTING_FEES: Record<number, number> = { 24: 0, 21: 0.05, 18: 0.08, 14: 0.10 };
const PURITY: Record<number, number> = { 24: 1, 21: 0.875, 18: 0.75, 14: 0.585 };

interface CalcResult {
  karat: number;
  weight: number;
  goldValue: number;
  buy: number;
  sell: number;
  fee: number;
  totalBuy: number;
  totalSell: number;
  usdEquivalent: number;
}

interface InvestResult {
  investedAmount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  buyPrice: number;
  currentPrice: number;
}

export function GoldCalculator() {
  const { prices, isLoading } = useGoldContext();
  const [weight, setWeight] = useState("");
  const [karat, setKarat] = useState(21);
  const [result, setResult] = useState<CalcResult | null>(null);

  // Investment tracker state
  const [investWeight, setInvestWeight] = useState("");
  const [investBuyPrice, setInvestBuyPrice] = useState("");
  const [investResult, setInvestResult] = useState<InvestResult | null>(null);

  const getPrice = (k: number) => {
    if (!prices) return 0;
    if (k === 24) return prices.karat24.buyPrice;
    if (k === 21) return prices.karat21.buyPrice;
    if (k === 18) return prices.karat18.buyPrice;
    return prices.karat21.buyPrice * PURITY[k];
  };

  const currentPrice = getPrice(karat);
  const dollarRate = prices?.dollar ?? 0;

  useEffect(() => {
    if (!weight || !prices) { setResult(null); return; }
    const nw = parseFloat(weight);
    if (isNaN(nw) || nw <= 0) { setResult(null); return; }
    const bp = getPrice(karat);
    const gv = Math.round(bp * nw);
    const fr = CRAFTING_FEES[karat] ?? 0.05;
    const cf = Math.round(gv * fr);
    const usdEquiv = dollarRate > 0 ? Math.round((gv / dollarRate) * 100) / 100 : 0;
    setResult({
      karat, weight: nw, goldValue: gv,
      buy: Math.round(gv * 1.02), sell: Math.round(gv * 0.98),
      fee: cf, totalBuy: Math.round(gv * 1.02) + cf,
      totalSell: Math.round(gv * 0.98),
      usdEquivalent: usdEquiv,
    });
  }, [weight, karat, prices, dollarRate]);

  // Investment return calculator
  useEffect(() => {
    if (!investWeight || !investBuyPrice || !prices) { setInvestResult(null); return; }
    const w = parseFloat(investWeight);
    const bp = parseFloat(investBuyPrice);
    if (isNaN(w) || isNaN(bp) || w <= 0 || bp <= 0) { setInvestResult(null); return; }
    const cp = getPrice(karat);
    const invested = Math.round(bp * w);
    const current = Math.round(cp * w);
    const profit = current - invested;
    const profitPercent = invested > 0 ? Math.round((profit / invested) * 10000) / 100 : 0;
    setInvestResult({
      investedAmount: invested, currentValue: current, profit, profitPercent,
      buyPrice: bp, currentPrice: cp,
    });
  }, [investWeight, investBuyPrice, karat, prices]);

  const quickBuyPrices = useMemo(() => {
    if (!prices) return [];
    return [
      { label: "اليوم", karat21: prices.karat21.buyPrice },
      { label: "أسبوع", karat21: prices.karat21.buyPrice * 0.98 },
      { label: "شهر", karat21: prices.karat21.buyPrice * 0.95 },
      { label: "3 شهور", karat21: prices.karat21.buyPrice * 0.90 },
    ];
  }, [prices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-3xl bg-gold-gradient mx-auto flex items-center justify-center mb-4 shadow-lg shadow-gold-500/30">
          <Gem className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black gold-text">حاسبة الذهب</h1>
        <p className="text-sm text-muted-foreground mt-1">احسب قيمة ذهبك بدقة وسهولة</p>
      </div>

      {/* Step 1: Karat Selection */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center font-black">1</span>
          اختر العيار
        </h2>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="اختيار العيار">
          {KARATS.map((v) => (
            <button key={v} type="button" onClick={() => setKarat(v)}
              className={cn("py-4 px-3 rounded-xl border-2 text-center font-bold text-sm transition-all duration-200",
                karat === v ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400 shadow-sm" : "border-border bg-muted/30 text-muted-foreground hover:border-gold-500/40"
              )}>
              <span className="text-lg font-black block leading-none">{v}</span>
              <span className="text-xs mt-1 block">عيار {v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Weight Input */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center font-black">2</span>
          أدخل الوزن بالجرام
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
              placeholder="الوزن" min="0" step="0.01" inputMode="decimal" aria-label="الوزن بالجرام"
              className="w-full text-3xl font-black text-center py-5 px-6 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors placeholder:text-muted-foreground/30" />
            <span className="absolute end-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/80 font-bold">جرام</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {GRAMS.map((g) => (
            <button key={g} type="button" onClick={() => setWeight(String(g))}
              className={cn("flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200",
                weight === String(g) ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400" : "border-border bg-muted/20 text-muted-foreground hover:border-gold-500/30"
              )}>{g}</button>
          ))}
        </div>
      </div>

      {/* Current Price Info */}
      {prices && !isLoading && (
        <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-600 dark:text-blue-400">
            سعر عيار {karat} الحالي:{" "}
            <span className="font-bold text-sm">{formatPrice(currentPrice)} ج.م</span>
            {dollarRate > 0 && (
              <>
                <span className="mx-2">·</span>
                <DollarSign className="w-3 h-3 inline" />
                <span className="font-bold">${formatPrice(currentPrice / dollarRate)}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Main Value */}
          <div className="rounded-2xl border-2 border-gold-500/30 bg-gradient-to-br from-gold-500/15 to-amber-600/10 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent)] pointer-events-none" />
            <Coins className="w-8 h-8 text-gold-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">قيمة {result.weight} جرام عيار {result.karat}</p>
            <p className="text-4xl md:text-5xl font-black gold-text">{formatCurrency(result.goldValue)}</p>
            <p className="text-[11px] text-muted-foreground mt-2 opacity-60">سعر الذهب الخام بدون مصنعية</p>
            {result.usdEquivalent > 0 && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                ≈ ${result.usdEquivalent.toLocaleString("en-US")} دولار أمريكي
              </p>
            )}
          </div>

          {/* Buy/Sell */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-green-500/20 bg-green-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">سعر الشراء</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400">{formatCurrency(result.buy)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 opacity-60">سعر السوق + 2%</p>
            </div>
            <div className="rounded-xl border-2 border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">سعر البيع</p>
              <p className="text-xl font-black text-red-500">{formatCurrency(result.sell)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 opacity-60">سعر السوق - 2%</p>
            </div>
          </div>

          {/* Crafting Fee */}
          {result.fee > 0 && (
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-4 h-4 text-gold-500" />
                  <div>
                    <p className="font-bold text-sm">مع أجرة الصُنعة</p>
                    <p className="text-xs text-muted-foreground mt-0.5">أجرة الصُنعة: {formatCurrency(result.fee)}</p>
                  </div>
                </div>
                <p className="text-2xl font-black gold-text">{formatCurrency(result.totalBuy)}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center px-4 opacity-60">
            * هذه الأسعار تقريبية. قد تختلف أسعار المحلات بناءً على أجرة الصُنعة والعروض الخاصة.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!result && !weight && (
        <div className="text-center py-10 text-muted-foreground">
          <Scale className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">أدخل الوزن</p>
          <p className="text-sm opacity-60 mt-1">اختر العيار وأدخل الوزن لحساب القيمة</p>
        </div>
      )}

      {/* Investment Return Calculator */}
      {prices && (
        <div className="rounded-2xl border-2 border-border bg-card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-green-500" />
            حاسبة العائد على الاستثمار
          </h2>
          <p className="text-xs text-muted-foreground mb-4">هل اشتريت ذهب من قبل؟ احسب ربحك أو خسارتك</p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الوزن بالجرام</label>
                <input type="number" value={investWeight} onChange={(e) => setInvestWeight(e.target.value)}
                  placeholder="مثال: 10" min="0" step="0.01" inputMode="decimal"
                  className="w-full text-lg font-bold text-center py-3 px-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors placeholder:text-muted-foreground/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">سعر الشراء للجرام</label>
                <input type="number" value={investBuyPrice} onChange={(e) => setInvestBuyPrice(e.target.value)}
                  placeholder="مثال: 3000" min="0" step="1" inputMode="decimal"
                  className="w-full text-lg font-bold text-center py-3 px-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors placeholder:text-muted-foreground/30" />
              </div>
            </div>

            {/* Quick fill buttons */}
            <div className="flex gap-2">
              {quickBuyPrices.map(({ label, karat21 }) => (
                <button key={label} type="button"
                  onClick={() => { setInvestBuyPrice(String(Math.round(karat21))); setInvestWeight("10"); }}
                  className="flex-1 py-2 rounded-lg text-[11px] font-bold border border-border bg-muted/30 text-muted-foreground hover:border-gold-500/30 transition-all">
                  {label}: {formatPrice(karat21)}
                </button>
              ))}
            </div>

            {investResult && (
              <div className={cn(
                "rounded-xl border-2 p-4 mt-3",
                investResult.profit >= 0
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">النتيجة</span>
                  {investResult.profit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">المبلغ المستثمر</p>
                    <p className="text-sm font-black">{formatCurrency(investResult.investedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">القيمة الحالية</p>
                    <p className="text-sm font-black">{formatCurrency(investResult.currentValue)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    {investResult.profit >= 0 ? "الربح" : "الخسارة"}
                  </p>
                  <p className={cn(
                    "text-2xl font-black",
                    investResult.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                  )}>
                    {investResult.profit >= 0 ? "+" : ""}{formatCurrency(investResult.profit)}
                  </p>
                  <p className={cn(
                    "text-sm font-bold mt-1",
                    investResult.profitPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                  )}>
                    {investResult.profitPercent >= 0 ? "+" : ""}{investResult.profitPercent}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
