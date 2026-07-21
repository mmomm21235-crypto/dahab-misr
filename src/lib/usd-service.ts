const FALLBACK_RATE = 51.09;

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

export async function fetchUsdEgpRate(): Promise<number> {
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

    return rate;
  } catch (err) {
    return FALLBACK_RATE;
  }
}
