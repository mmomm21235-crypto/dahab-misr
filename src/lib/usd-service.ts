const FALLBACK_RATE = 50.85;

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

export async function fetchUsdEgpRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Exchange rate API responded with ${res.status}`);
      return FALLBACK_RATE;
    }

    const data: ExchangeRateResponse = await res.json();
    const rate = data.rates?.EGP;

    if (!rate || rate <= 0) {
      console.warn("No EGP rate in response, using fallback");
      return FALLBACK_RATE;
    }

    return rate;
  } catch (err) {
    console.warn("Failed to fetch exchange rate:", err);
    return FALLBACK_RATE;
  }
}
