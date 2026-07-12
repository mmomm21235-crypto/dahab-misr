export const CURRENCIES = [
  { code: "EGP", symbol: "ج.م", name: "الجنيه المصري", locale: "ar-EG", flag: "🇪🇬" },
  { code: "USD", symbol: "$", name: "الدولار الأمريكي", locale: "en-US", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "اليورو", locale: "de-DE", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "الجنيه الإسترليني", locale: "en-GB", flag: "🇬🇧" },
  { code: "SAR", symbol: "ر.س", name: "الريال السعودي", locale: "ar-SA", flag: "🇸🇦" },
  { code: "AED", symbol: "د.إ", name: "الدرهم الإماراتي", locale: "ar-AE", flag: "🇦🇪" },
];

export function convertFromEGP(amountInEGP: number, dollarRate: number, targetCurrency: string): number {
  if (targetCurrency === "EGP") return amountInEGP;
  const amountInUSD = amountInEGP / dollarRate;
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.67,
  };
  return Math.round(amountInUSD * (rates[targetCurrency] ?? 1) * 100) / 100;
}

export function formatCurrencyByCode(amountInEGP: number, dollarRate: number, currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return `${amountInEGP} ج.م`;
  if (currencyCode === "EGP") {
    return new Intl.NumberFormat("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountInEGP) + " ج.م";
  }
  const converted = convertFromEGP(amountInEGP, dollarRate, currencyCode);
  return new Intl.NumberFormat(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(converted) + " " + currency.symbol;
}
