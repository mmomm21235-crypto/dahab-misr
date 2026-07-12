import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCIES, convertFromEGP } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCurrency(price: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function getKaratLabel(karat: 24 | 21 | 18 | "pound"): string {
  const labels = {
    24: "عيار 24",
    21: "عيار 21",
    18: "عيار 18",
    pound: "الجنيه الذهب",
  };
  return labels[karat];
}

export function getPriceChangeColor(change: number): string {
  if (change > 0) return "text-green-500";
  if (change < 0) return "text-red-500";
  return "text-muted-foreground";
}

export function getPriceChangeBg(change: number): string {
  if (change > 0) return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (change < 0) return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-muted text-muted-foreground";
}

export function formatPriceWithCurrency(amountInEGP: number, currencyCode: string, dollarRate: number): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return `${amountInEGP} ج.م`;
  if (currencyCode === "EGP") {
    return new Intl.NumberFormat("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountInEGP) + " ج.م";
  }
  const converted = convertFromEGP(amountInEGP, dollarRate, currencyCode);
  return new Intl.NumberFormat(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(converted) + " " + currency.symbol;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function getKaratLabelString(karat: string | number): string {
  const labels: Record<string, string> = {
    "24": "عيار 24",
    "21": "عيار 21",
    "18": "عيار 18",
    "14": "عيار 14",
    pound: "الجنيه الذهب",
  };
  return labels[String(karat)] ?? `عيار ${karat}`;
}

export function getPrice(
  karat: number,
  prices: {
    karat24: { buyPrice: number };
    karat21: { buyPrice: number };
    karat18: { buyPrice: number };
  } | null,
  PURITY?: Record<number, number>
): number {
  if (!prices) return 0;
  if (karat === 24) return prices.karat24.buyPrice;
  if (karat === 21) return prices.karat21.buyPrice;
  if (karat === 18) return prices.karat18.buyPrice;
  if (PURITY && PURITY[karat]) return prices.karat21.buyPrice * PURITY[karat];
  return prices.karat21.buyPrice;
}

export const CATEGORY_COLORS: Record<string, string> = {
  gold: "bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/20",
  dollar: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  economy: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export const CATEGORY_LABELS: Record<string, string> = {
  gold: "ذهب",
  dollar: "دولار",
  economy: "اقتصاد",
};

export function formatTimeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}
