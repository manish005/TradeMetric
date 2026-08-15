import type { JournalEntry } from "@/lib/journal";
import { round } from "@/lib/format";

export type CurvePoint = { date: string; value: number };
export type MonthPoint = { key: string; label: string; pnl: number };
export type HeatCell = { date: string; net: number };

export interface TraderMetrics {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  bestDay: { date: string; net: number } | null;
  worstDay: { date: string; net: number } | null;
  currentStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  consistency: number;
  curve: CurvePoint[];
  months: MonthPoint[];
  heat: HeatCell[];
  last7Net: number;
}

export function netOf(e: JournalEntry): number {
  return round(e.profit - e.loss - e.commission, 2);
}

export function analyze(entries: JournalEntry[], initialBalance = 0): TraderMetrics {
  const sorted = [...entries].sort((a, b) =>
    a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1
  );

  const nets = sorted.map(netOf);

  const wins = nets.filter((n) => n > 0);
  const losses = nets.filter((n) => n < 0);
  const grossWin = wins.reduce((s, n) => s + n, 0);
  const grossLoss = Math.abs(losses.reduce((s, n) => s + n, 0));
  const netProfit = round(nets.reduce((s, n) => s + n, 0), 2);

  // Equity curve (balance) + max drawdown on cumulative net
  let cum = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const byDate = new Map<string, number>();
  const dateOrder: string[] = [];
  sorted.forEach((e, i) => {
    cum = round(cum + nets[i], 2);
    const prev = byDate.get(e.date) ?? 0;
    byDate.set(e.date, round(prev + nets[i], 2));
    if (!dateOrder.includes(e.date)) dateOrder.push(e.date);
    peak = Math.max(peak, cum);
    maxDrawdown = Math.max(maxDrawdown, peak - cum);
  });
  const curve: CurvePoint[] = [
    { date: sorted[0]?.date ?? todayKey(), value: initialBalance },
    ...dateOrder.map((d) => ({ date: d, value: round(initialBalance + (byDate.get(d) ?? 0), 2) })),
  ];

  // Best / worst days
  let bestDay: { date: string; net: number } | null = null;
  let worstDay: { date: string; net: number } | null = null;
  dateOrder.forEach((d) => {
    const net = byDate.get(d) ?? 0;
    if (!bestDay || net > bestDay.net) bestDay = { date: d, net };
    if (!worstDay || net < worstDay.net) worstDay = { date: d, net };
  });

  // Streaks
  let curWin = 0;
  let curLoss = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  nets.forEach((n) => {
    if (n > 0) {
      curWin += 1;
      curLoss = 0;
    } else if (n < 0) {
      curLoss += 1;
      curWin = 0;
    } else {
      curWin = 0;
      curLoss = 0;
    }
    maxWinStreak = Math.max(maxWinStreak, curWin);
    maxLossStreak = Math.max(maxLossStreak, curLoss);
  });
  const currentStreak = curWin > 0 ? curWin : curLoss > 0 ? -curLoss : 0;

  // Monthly P&L
  const monthMap = new Map<string, number>();
  sorted.forEach((e, i) => {
    const key = e.date.slice(0, 7);
    monthMap.set(key, round((monthMap.get(key) ?? 0) + nets[i], 2));
  });
  const months: MonthPoint[] = [...monthMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, pnl]) => ({
      key,
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      }),
      pnl,
    }));

  // 16-week heatmap ending today
  const heat: HeatCell[] = [];
  for (let i = 111; i >= 0; i--) {
    const d = dayKeyOffset(i);
    heat.push({ date: d, net: byDate.get(d) ?? 0 });
  }

  const consistency =
    entries.length > 0
      ? round((entries.filter((e) => e.achieved).length / entries.length) * 100, 1)
      : 0;

  const last7 = heat.slice(-7).filter((c) => c.net !== 0).reduce((s, c) => s + c.net, 0);

  return {
    total: entries.length,
    wins: wins.length,
    losses: losses.length,
    winRate: entries.length ? round((wins.length / entries.length) * 100, 1) : 0,
    netProfit,
    avgWin: wins.length ? round(grossWin / wins.length, 2) : 0,
    avgLoss: losses.length ? round(grossLoss / losses.length, 2) : 0,
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss, 2) : grossWin > 0 ? Infinity : 0,
    expectancy: entries.length ? round(netProfit / entries.length, 2) : 0,
    maxDrawdown: round(maxDrawdown, 2),
    bestDay,
    worstDay,
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    consistency,
    curve,
    months,
    heat,
    last7Net: round(last7, 2),
  };
}

const DAY_MS = 86400000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayKeyOffset(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

export function currentBalance(entries: JournalEntry[], initialBalance: number): number {
  return round(entries.reduce((s, e) => s + netOf(e), 0) + initialBalance, 2);
}

export function netSince(entries: JournalEntry[], daysAgo: number): number {
  const from = dayKeyOffset(daysAgo);
  return round(
    entries
      .filter((e) => e.date >= from)
      .reduce((s, e) => s + netOf(e), 0),
    2
  );
}