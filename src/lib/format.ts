import type { CurrencyKey } from "./types";

export const CURRENCIES: Record<
  CurrencyKey,
  { symbol: string; locale: string; name: string }
> = {
  dollar: { symbol: "$", locale: "en-US", name: "US Dollar" },
  euro: { symbol: "€", locale: "de-DE", name: "Euro" },
  pound: { symbol: "£", locale: "en-GB", name: "British Pound" },
  rupee: { symbol: "₹", locale: "en-IN", name: "Indian Rupee" },
  yen: { symbol: "¥", locale: "ja-JP", name: "Japanese Yen" },
};

export const DEFAULT_START_DATE = (() => {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
})();

export function money(
  value: number,
  currency: CurrencyKey,
  digits = 2
): string {
  const { symbol, locale } = CURRENCIES[currency];
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return `${symbol}${formatted}`;
}

const COMPACT_UNITS = ["K", "M", "B", "T"] as const;

export function moneyCompact(
  value: number,
  currency: CurrencyKey
): string {
  const { symbol, locale } = CURRENCIES[currency];
  const abs = Math.abs(value);
  let v = value;
  let unit = "";
  if (currency === "rupee") {
    if (abs >= 1e7) {
      v /= 1e7;
      unit = " Cr";
    } else if (abs >= 1e5) {
      v /= 1e5;
      unit = " Lakh";
    } else if (abs >= 1e3) {
      v /= 1e3;
      unit = "K";
    }
  } else if (abs >= 1e12) {
    v /= 1e12;
    unit = COMPACT_UNITS[3];
  } else if (abs >= 1e9) {
    v /= 1e9;
    unit = COMPACT_UNITS[2];
  } else if (abs >= 1e6) {
    v /= 1e6;
    unit = COMPACT_UNITS[1];
  } else if (abs >= 1e3) {
    v /= 1e3;
    unit = COMPACT_UNITS[0];
  }
  const hasFraction = Math.abs(v % 1) > 1e-9;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(round(v, 2));
  return `${symbol}${formatted}${unit}`;
}

export function number(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(round(value, digits));
}

export function round(value: number, dp = 2): number {
  const f = Math.pow(10, dp);
  // Avoid floating point noise (0.1+0.2 style) before rounding.
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function percent(value: number, digits = 2): string {
  return `${number(value, digits)}%`;
}

export function percentCompact(value: number, digits = 2): string {
  const abs = Math.abs(value);
  if (abs < 1e6) return percent(value, digits);
  return `${value.toExponential(digits).replace("e", "E")}%`;
}

export function todayISO(): string {
  return DEFAULT_START_DATE;
}