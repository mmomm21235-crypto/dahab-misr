const FALLBACK_RATE = 51.09;

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchUsdEgpRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return cachedRate.rate;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return FALLBACK_RATE;
    }

    const data: ExchangeRateResponse = await res.json();
    const rate = data.rates?.EGP;

    if (!rate || rate <= 0) {
      return FALLBACK_RATE;
    }

    cachedRate = { rate, timestamp: Date.now() };
    return rate;
  } catch {
    return FALLBACK_RATE;
  }
}
