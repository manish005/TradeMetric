export type RateIso = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export const RATE_ISOS: RateIso[] = ["USD", "EUR", "GBP", "INR", "JPY"];

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 146.5,
};

export async function loadRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { rates?: Record<string, number> };
    const r = data?.rates;
    if (r && typeof r.USD === "number") {
      const filtered: Record<string, number> = {};
      for (const iso of RATE_ISOS) {
        if (typeof r[iso] === "number") filtered[iso] = r[iso];
      }
      if (filtered.USD && Object.keys(filtered).length >= 2) return filtered;
    }
  } catch {
    // offline / blocked – fall back to approximate rates
  }
  return { ...FALLBACK_RATES };
}

export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}