"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import type { CalcResult, Breakdown, PeriodRow } from "@/lib/types";
import { CURRENCIES, money, moneyCompact, percent, percentCompact, round } from "@/lib/format";
import { setProjected } from "@/lib/journal";
import {
  IconChevL,
  IconChevR,
  IconDownload,
  IconReset,
  IconShare,
  IconTarget,
} from "@/components/icons";

const PAGE_SIZE = 25;

const COLS = [
  { key: "deposit", label: "Deposit" },
  { key: "withdrawal", label: "Withdrawal" },
  { key: "earnings", label: "Earnings" },
  { key: "reinvested", label: "Reinvest" },
  { key: "totalEarnings", label: "Total Earnings" },
  { key: "cashOut", label: "Cash out" },
  { key: "balance", label: "Balance" },
] as const;

export default function ResultsPanel({
  result,
  input,
  onReset,
}: {
  result: CalcResult;
  input: {
    years: number;
    months: number;
    days: number;
    reinvestPercent: number;
    currency: keyof typeof CURRENCIES;
    amount: number;
  };
  onReset: () => void;
}) {
  const [breakdown, setBreakdown] = useState<Breakdown>("month");
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const currency = input.currency;

  const dailyTarget = round((input.amount * result.dailyRatePct) / 100, 2);

  // Publish today's projected target for the Journal tool
  useEffect(() => {
    setProjected(dailyTarget, new Date().toISOString().slice(0, 10));
  }, [dailyTarget]);

  const tableRows =
    breakdown === "day"
      ? result.byDay
      : breakdown === "week"
        ? result.byWeek
        : breakdown === "month"
          ? result.byMonth
          : result.byYear;

  const hasSchedule = tableRows.length > 0;

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = tableRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const downloadCSV = () => {
    const rows = tableRows.map((r) =>
      [
        r.label,
        r.deposit.toFixed(2),
        r.withdrawal.toFixed(2),
        r.earnings.toFixed(2),
        r.reinvested.toFixed(2),
        r.totalEarnings.toFixed(2),
        r.cashOut.toFixed(2),
        r.balance.toFixed(2),
      ].join(",")
    );
    const header =
      "Period,Deposit,Withdrawal,Earnings,Reinvest,Total Earnings,Cash out,Balance";
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradermatrix-${breakdown}-breakdown.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(
      window.location.host === "tradermatrix.in" ||
        window.location.host === "www.tradermatrix.in"
        ? window.location.href
        : "https://tradermatrix.in"
    );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="animate-rise flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-ink">
          Projection for{" "}
          <span className="text-mint">
            {input.years > 0 && `${input.years} year${input.years > 1 ? "s" : ""}`}
            {input.months > 0 &&
              `${input.years > 0 ? " " : ""}${input.months} month${
                input.months > 1 ? "s" : ""
              }`}
            {input.days > 0 &&
              `${input.years > 0 || input.months > 0 ? " " : ""}${input.days} day${
                input.days > 1 ? "s" : ""
              }`}
            {input.years === 0 && input.months === 0 && input.days === 0 && "—"}
          </span>
        </h2>
      </div>

      {!hasSchedule ? (
        <div className="rounded-2xl border border-line bg-panel p-6 text-center text-muted">
          Enter a principal, rate and a period to see your projection.
        </div>
      ) : (
        <>
          {/* Top summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/10 via-panel to-panel p-4 shadow-[0_16px_40px_-20px_rgba(52,211,153,0.35)]"
            >
              <div className="text-[12px] font-medium text-muted">
                Investment value
              </div>
              <AnimatedMoney
                value={result.finalValue}
                currency={currency}
                compact
                className="mt-1 text-2xl font-extrabold tabular-nums text-mint sm:text-[28px]"
              />
              <div className="mt-2 text-[12px] text-faint">
                after {result.totalDays} day
                {result.totalDays === 1 ? "" : "s"} · exact{" "}
                {money(result.finalValue, currency)}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-amber/20 bg-gradient-to-br from-amber/10 via-panel to-panel p-4 shadow-[0_16px_40px_-20px_rgba(251,191,36,0.3)]"
            >
              <div className="text-[12px] font-medium text-muted">
                Total interest / earnings
              </div>
              <AnimatedMoney
                value={result.totalInterest}
                currency={currency}
                compact
                className="mt-1 text-2xl font-extrabold tabular-nums text-amber sm:text-[28px]"
              />
              <div className="mt-2 text-[12px] text-faint">
                {percent(result.percentageProfit, 1)} profit on{" "}
                {money(result.invested, currency)}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-panel p-4">
              <div className="text-[12px] font-medium text-muted">
                Total days / Business days
              </div>
              <div className="mt-1 text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
                {result.totalDays} / {result.businessDays}
              </div>
              <div className="mt-2 text-[12px] text-faint">
                {result.startDate} → {result.endDate}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4">
              <div className="text-[12px] font-medium text-muted">
                Daily interest rate
              </div>
              <div className="mt-1 text-xl font-extrabold tabular-nums text-cyan sm:text-2xl">
                {percent(result.dailyRatePct, 3)}
              </div>
              <div className="mt-2 text-[12px] text-faint">
                APY{" "}
                <span className="font-bold text-mint">
                  {percentCompact(result.apyPct, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Flow chips */}
          <TradesTarget
            dailyTarget={dailyTarget}
            currency={currency}
          />
          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-muted">
              Deposits{" "}
              <b className="text-ink">{moneyCompact(result.totalDeposits, currency)}</b>
            </span>
            <span className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-muted">
              Withdrawals{" "}
              <b className="text-coral">
                {moneyCompact(result.totalWithdrawals, currency)}
              </b>
            </span>
            <span className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-muted">
              Cash out{" "}
              <b className="text-amber">{moneyCompact(result.totalCashOut, currency)}</b>
            </span>
          </div>

          {/* Breakdown switcher + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-line bg-panel2 p-1">
              {(["day", "week", "month", "year"] as Breakdown[]).map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBreakdown(b);
                    setPage(1);
                  }}
                  className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold capitalize transition-colors ${
                    breakdown === b
                      ? "bg-mint/15 text-mint"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyShare}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel2 px-3 text-[12px] font-medium text-muted transition-colors hover:border-mint/60 hover:text-mint"
              >
                <IconShare className="h-3.5 w-3.5" />
                {copied ? "✓ Copied!" : "Share"}
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel2 px-3 text-[12px] font-medium text-muted transition-colors hover:border-cyan/60 hover:text-cyan"
              >
                <IconDownload className="h-3.5 w-3.5" />
                CSV
              </button>
              <button
                onClick={onReset}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel2 px-3 text-[12px] font-medium text-muted transition-colors hover:border-coral/60 hover:text-coral"
              >
                <IconReset className="h-3.5 w-3.5" />
                Start over
              </button>
            </div>
          </div>

          <AmortizationTable
            rows={pagedRows}
            allRows={tableRows}
            breakdown={breakdown}
            currency={currency}
            reinvestPercent={input.reinvestPercent}
          />

          <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
            <span className="tabular-nums">
              Showing {pagedRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
              –{Math.min(safePage * PAGE_SIZE, tableRows.length)} of{" "}
              {tableRows.length} {breakdown}
              {tableRows.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-panel2 px-3 font-medium text-muted transition-colors hover:border-mint/60 hover:text-mint disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevL className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="px-1 tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-panel2 px-3 font-medium text-muted transition-colors hover:border-mint/60 hover:text-mint disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <IconChevR className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const SYMBOLS: Record<string, { label: string; pt: number }> = {
  XAUUSD: { label: "Gold · XAUUSD", pt: 1.0 },
  XAGUSD: { label: "Silver · XAGUSD", pt: 0.05 },
  US30: { label: "Dow · US30", pt: 0.1 },
  NAS100: { label: "Nasdaq · NAS100", pt: 0.2 },
  EURUSD: { label: "EURUSD", pt: 0.1 },
  GBPUSD: { label: "GBPUSD", pt: 0.1 },
  USDJPY: { label: "USDJPY", pt: 0.09 },
  BTCUSD: { label: "Bitcoin · BTCUSD", pt: 0.01 },
};

function TradesTarget({
  dailyTarget,
  currency,
}: {
  dailyTarget: number;
  currency: keyof typeof CURRENCIES;
}) {
  const [move, setMove] = useState(5);
  const [lot, setLot] = useState(0.01);
  const [symbol, setSymbol] = useState("XAUUSD");

  const ptVal = SYMBOLS[symbol].pt;
  const pointProfit = move * ptVal;
  const profitPerTrade = round(pointProfit * (lot / 0.01), 2);
  const trades = profitPerTrade > 0 ? Math.ceil(dailyTarget / profitPerTrade) : 0;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint/15 text-mint ring-1 ring-mint/20">
            <IconTarget className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[13px] font-bold text-ink">
              How many trades to hit today&apos;s target?
            </div>
            <div className="text-[11px] text-faint">
              Today&apos;s earning:{" "}
              <b className="text-mint">{money(dailyTarget, currency)}</b>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-faint">Orders needed</div>
          <div className="text-lg font-black tabular-nums text-mint">
            ≈ {trades > 99 ? "99+" : trades}{" "}
            <span className="text-[12px] font-bold text-muted">
              {trades === 1 ? "order" : "orders"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-faint">Symbol (pair)</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-mint/70"
          >
            {Object.entries(SYMBOLS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-faint">Movement (pts)</span>
          <input
            type="number"
            min={1}
            value={move}
            onChange={(e) => setMove(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] tabular-nums text-ink outline-none transition-colors focus:border-mint/70"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-faint">Lot size</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={lot}
            onChange={(e) => setLot(Math.max(0.01, Number(e.target.value) || 0.01))}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] tabular-nums text-ink outline-none transition-colors focus:border-mint/70"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-faint">
        <span>
          {move} pts × {money(ptVal, "dollar")}/pt ={" "}
          <b className="text-ink">{money(pointProfit, "dollar")}</b> per{" "}
          <b className="text-ink">{lot}</b> lot
        </span>
        <span>
          Each order ≈{" "}
          <b className="text-ink">{money(profitPerTrade, currency)}</b>
        </span>
        <span className="text-[11px]">
          {symbol}: 5 pts @ 0.01 lot = {money(5 * ptVal, "dollar")}
        </span>
      </div>
    </div>
  );
}

function AmortizationTable({
  rows,
  allRows,
  breakdown,
  currency,
  reinvestPercent,
}: {
  rows: PeriodRow[];
  allRows: PeriodRow[];
  breakdown: Breakdown;
  currency: keyof typeof CURRENCIES;
  reinvestPercent: number;
}) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());  const totals: Record<(typeof COLS)[number]["key"], number> = {
    deposit: 0,
    withdrawal: 0,
    earnings: 0,
    reinvested: 0,
    totalEarnings: rows[rows.length - 1]?.totalEarnings ?? 0,
    cashOut: 0,
    balance: rows[rows.length - 1]?.balance ?? 0,
  };
  for (const r of allRows) {
    totals.deposit += r.deposit;
    totals.withdrawal += r.withdrawal;
    totals.earnings += r.earnings;
    totals.reinvested += r.reinvested;
    totals.cashOut += r.cashOut;
  }
  totals.totalEarnings = allRows[allRows.length - 1]?.totalEarnings ?? 0;
  totals.balance = allRows[allRows.length - 1]?.balance ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="max-h-[75vh] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
          <thead>
            <tr className="sticky top-0 z-10 bg-panel2 text-left">
              <th className="sticky left-0 z-20 bg-panel2 px-3 py-2.5">
                <span className="sr-only">Target met</span>
              </th>
              <th className="th-sticky sticky left-10 z-20 bg-panel2 px-4 py-2.5 font-bold text-cyan">
                {breakdown === "day"
                  ? "Day"
                  : breakdown === "week"
                    ? "Week end"
                    : breakdown === "month"
                      ? "Month"
                      : "Year"}
              </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2.5 font-bold ${
                  c.key === "balance"
                    ? "text-mint"
                    : c.key === "totalEarnings"
                      ? "text-amber"
                      : "text-muted"
                }`}
              >
                {c.key === "reinvested"
                  ? `Reinvest (${reinvestPercent}%)`
                  : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTicked = ticked.has(r.label);
            return (
            <tr
              key={r.label}
              className={`border-t border-line transition-colors ${
                isTicked
                  ? "bg-mint/40 hover:bg-mint/40"
                  : `hover:bg-panel2/60 ${i % 2 === 1 ? "bg-panel2/40" : ""}`
              }`}
            >
              <td
                className={`sticky left-0 z-10 px-3 py-2 ${
                  isTicked
                    ? "bg-mint/40"
                    : i % 2 === 1
                      ? "bg-[var(--color-panel2)]/40"
                      : "bg-[var(--color-panel)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={ticked.has(r.label)}
                  onChange={() =>
                    setTicked((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.label)) next.delete(r.label);
                      else next.add(r.label);
                      return next;
                    })
                  }
                  className="h-4 w-4 cursor-pointer rounded border-line accent-[var(--color-mint)]"
                  aria-label={`Target met on ${r.label}`}
                />
              </td>
              <td
                className={`th-sticky sticky left-10 px-4 py-2 font-semibold whitespace-nowrap ${
                  isTicked
                    ? "bg-mint/40 text-ink"
                    : "bg-[var(--color-panel)] text-ink"
                }`}
              >
                {r.label}
                {r.partial && <span className="ml-0.5 text-amber">*</span>}
              </td>
              {COLS.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2 tabular-nums whitespace-nowrap ${
                    c.key === "balance"
                      ? "font-bold text-mint"
                      : c.key === "totalEarnings"
                        ? "font-semibold text-amber"
                        : c.key === "withdrawal" && r.withdrawal > 0
                          ? "font-semibold text-coral"
                          : c.key === "deposit" && r.deposit > 0
                            ? "font-semibold text-cyan"
                            : "text-muted"
                  }`}
                >
                  {moneyCompact(
                    r[c.key as keyof PeriodRow] as number,
                    currency
                  )}
                </td>
              ))}
            </tr>
            );
          })}
          <tr className="border-t-2 border-line bg-panel2">
            <td className="sticky left-0 z-10 bg-panel2 px-3 py-2.5" />
            <td className="th-sticky sticky left-10 bg-panel2 px-4 py-2.5 font-bold text-ink">
              Total
            </td>
            {COLS.map((c) => (
              <td
                key={c.key}
                className={`px-3 py-2.5 font-bold tabular-nums ${
                  c.key === "balance"
                    ? "text-mint"
                    : c.key === "totalEarnings"
                      ? "text-amber"
                      : "text-ink"
                }`}
              >
                {moneyCompact(totals[c.key], currency)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
      <div className="border-t border-line px-4 py-2 text-[11px] text-faint">
        * indicates part of a {breakdown}.
      </div>
    </div>
  );
}

function AnimatedMoney({
  value,
  currency,
  compact,
  className,
}: {
  value: number;
  currency: keyof typeof CURRENCIES;
  compact?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(display, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {compact
        ? moneyCompact(round(display, 2), currency)
        : money(round(display, 2), currency)}
    </span>
  );
}