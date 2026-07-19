// ===== Gold Price Types =====
export interface GoldPrice {
  karat: 24 | 21 | 18 | "pound";
  buyPrice: number;
  sellPrice: number;
  change: number;
  changePercent: number;
}

export interface GoldPrices {
  karat24: GoldPrice;
  karat21: GoldPrice;
  karat18: GoldPrice;
  pound: GoldPrice;
  dollar: number;
  lastUpdated: string;
  source: string;
}

export interface GoldHistoryPoint {
  date: string;
  price24: number;
  price21: number;
  price18: number;
}

export type ChartPeriod = "day" | "week" | "month" | "3months" | "6months" | "year";

// ===== Calculator Types =====
export interface CalculatorResult {
  karat: number;
  weight: number;
  goldValue: number;
  buyPrice: number;
  sellPrice: number;
  craftingFee: number;
  totalBuy: number;
  totalSell: number;
}

// ===== News Types =====
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "gold" | "dollar" | "economy";
  source: string;
  date: string;
  imageUrl?: string;
  url?: string;
}

// ===== Alert Types =====
export interface PriceAlert {
  id: string;
  karat: 24 | 21 | 18 | "pound";
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  notified: boolean;
}

// ===== Settings Types =====
export interface AppSettings {
  theme: "light" | "dark" | "system";
  language: "ar" | "en";
  notifications: boolean;
  currency: string;
  alertSound?: boolean;
  refreshInterval?: number;
}

// ===== Navigation Types =====
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}
