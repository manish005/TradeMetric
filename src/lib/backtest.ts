export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type Timeframe =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "45m"
  | "1h"
  | "2h"
  | "4h"
  | "1d"
  | "1w"
  | "1M"
  | "1y";

export const TIMEFRAMES: Array<{ key: Timeframe; label: string; ms: number }> = [
  { key: "1m", label: "1m", ms: 60_000 },
  { key: "3m", label: "3m", ms: 180_000 },
  { key: "5m", label: "5m", ms: 300_000 },
  { key: "15m", label: "15m", ms: 900_000 },
  { key: "30m", label: "30m", ms: 1_800_000 },
  { key: "45m", label: "45m", ms: 2_700_000 },
  { key: "1h", label: "1h", ms: 3_600_000 },
  { key: "2h", label: "2h", ms: 7_200_000 },
  { key: "4h", label: "4h", ms: 14_400_000 },
  { key: "1d", label: "1d", ms: 86_400_000 },
  { key: "1w", label: "1w", ms: 604_800_000 },
  { key: "1M", label: "1M", ms: 2_592_000_000 },
  { key: "1y", label: "1y", ms: 31_536_000_000 },
];

const BINANCE_TFS = new Set<Timeframe>([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
  "1w",
  "1M",
]);

export interface SymbolSpec {
  id: string;
  name: string;
  category: "Metals" | "Forex" | "Indices" | "Crypto";
  base: number;
  pip: number;
  dayVol: number;
  binance?: string;
}

export const SYMBOLS: SymbolSpec[] = [
  { id: "XAUUSD", name: "Gold / US Dollar", category: "Metals", base: 2400, pip: 0.01, dayVol: 0.011 },
  { id: "XAGUSD", name: "Silver / US Dollar", category: "Metals", base: 29.5, pip: 0.001, dayVol: 0.018 },
  { id: "EURUSD", name: "Euro / US Dollar", category: "Forex", base: 1.085, pip: 0.0001, dayVol: 0.004 },
  { id: "GBPUSD", name: "Pound / US Dollar", category: "Forex", base: 1.27, pip: 0.0001, dayVol: 0.0045 },
  { id: "USDJPY", name: "US Dollar / Yen", category: "Forex", base: 146.5, pip: 0.001, dayVol: 0.005 },
  { id: "USDINR", name: "US Dollar / Rupee", category: "Forex", base: 83.4, pip: 0.01, dayVol: 0.004 },
  { id: "AUDUSD", name: "Australian / US Dollar", category: "Forex", base: 0.655, pip: 0.0001, dayVol: 0.005 },
  { id: "USDCAD", name: "US Dollar / Canadian Dollar", category: "Forex", base: 1.37, pip: 0.0001, dayVol: 0.0045 },
  { id: "USDCHF", name: "US Dollar / Swiss Franc", category: "Forex", base: 0.885, pip: 0.0001, dayVol: 0.004 },
  { id: "US30", name: "Dow Jones (ETF CFD)", category: "Indices", base: 44000, pip: 1, dayVol: 0.011 },
  { id: "NAS100", name: "Nasdaq 100 (ETF CFD)", category: "Indices", base: 21500, pip: 0.1, dayVol: 0.014 },
  { id: "SPX500", name: "S&P 500 (ETF CFD)", category: "Indices", base: 6100, pip: 0.1, dayVol: 0.012 },
  { id: "BTCUSDT", name: "Bitcoin / Tether", category: "Crypto", base: 98000, pip: 0.01, dayVol: 0.028, binance: "BTCUSDT" },
  { id: "ETHUSDT", name: "Ethereum / Tether", category: "Crypto", base: 3400, pip: 0.01, dayVol: 0.035, binance: "ETHUSDT" },
  { id: "SOLUSDT", name: "Solana / Tether", category: "Crypto", base: 150, pip: 0.01, dayVol: 0.05, binance: "SOLUSDT" },
  { id: "BNBUSDT", name: "BNB / Tether", category: "Crypto", base: 600, pip: 0.01, dayVol: 0.03, binance: "BNBUSDT" },
  { id: "XRPUSDT", name: "XRP / Tether", category: "Crypto", base: 2.2, pip: 0.0001, dayVol: 0.05, binance: "XRPUSDT" },
];

export const SYMBOL_MAP: Record<string, SymbolSpec> = Object.fromEntries(
  SYMBOLS.map((s) => [s.id, s])
);

// Deterministic PRNG (mulberry32) so every device sees the same simulated candles.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function roundTo(v: number, pip: number): number {
  const d = Math.max(0, Math.round(-Math.log10(pip)));
  return Number(v.toFixed(d));
}

export function generateCandles(
  spec: SymbolSpec,
  tfMs: number,
  count: number,
  endTime = Date.now()
): Candle[] {
  const rand = mulberry32(hashSeed(`${spec.id}:${tfMs}`));
  const barsToEnd = Math.max(0, Math.floor(endTime / tfMs) - 1) * tfMs;
  const startT = barsToEnd - (count - 1) * tfMs;
  const perBarVol = spec.dayVol * Math.sqrt(tfMs / 86_400_000);
  const candles: Candle[] = [];
  let price = spec.base * (1 - spec.dayVol * (count / 240) * (rand() - 0.5));
  let momentum = 0;
  for (let i = 0; i < count; i++) {
    const shock = gauss(rand) * perBarVol + (spec.dayVol * 0.02 * (rand() - 0.5));
    const ret = shock + momentum * 0.18;
    const o = price;
    const c = roundTo(o * (1 + ret), spec.pip);
    const wick = Math.abs(gauss(rand)) * perBarVol * 0.5;
    const h = roundTo(Math.max(o, c) * (1 + wick), spec.pip);
    const l = roundTo(Math.min(o, c) * (1 - wick * (0.6 + rand() * 0.8)), spec.pip);
    const v = 10000 * (0.4 + rand() * 2.2) * (1 + 5 * Math.abs(ret));
    candles.push({ t: startT + i * tfMs, o, h, l, c, v: Math.round(v) });
    price = c;
    momentum = ret * 0.6 + momentum * 0.4;
  }
  return candles;
}

export interface BinanceKline {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export async function fetchBinanceCandles(
  binanceSymbol: string,
  tf: Timeframe,
  limit = 400
): Promise<BinanceKline[] | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(binanceSymbol)}&interval=${tf}&limit=${limit}`
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<[number, string, string, string, string, string]>;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map((r) => ({
      t: r[0],
      o: Number(r[1]),
      h: Number(r[2]),
      l: Number(r[3]),
      c: Number(r[4]),
      v: Number(r[5]),
    }));
  } catch {
    return null;
  }
}

export interface LoadedSeries {
  candles: Candle[];
  source: "live" | "simulated";
}

export async function loadSeries(symbol: SymbolSpec, tf: Timeframe): Promise<LoadedSeries> {
  if (symbol.binance && BINANCE_TFS.has(tf)) {
    const live = await fetchBinanceCandles(symbol.binance, tf);
    if (live && live.length > 20) {
      return { candles: live, source: "live" };
    }
  }
  const tfMs = TIMEFRAMES.find((t) => t.key === tf)?.ms ?? 3_600_000;
  return {
    candles: generateCandles(symbol, tfMs, 400),
    source: "simulated",
  };
}

export function fmtPrice(v: number, pip: number): string {
  const d = Math.max(0, Math.round(-Math.log10(pip)));
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function fmtTime(t: number, tfMs: number): string {
  const d = new Date(t);
  if (tfMs >= 86_400_000) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  if (tfMs >= 3_600_000) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}