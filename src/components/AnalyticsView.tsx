"use client";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "@/lib/settings";
import { money, moneyCompact } from "@/lib/format";
import type { CurrencyKey } from "@/lib/types";
import {
  getInitialBalance,
  getJournalEntries,
  getJournalVersion,
  subscribeJournal,
} from "@/lib/journal";
import { analyze, type CurvePoint } from "@/lib/analysis";

export default function AnalyticsView() {
  useSyncExternalStore(subscribeJournal, getJournalVersion);
  const { currency } = useSettings();
  const cur = currency as CurrencyKey;

  const entries = getJournalEntries();
  const initial = getInitialBalance();
  const m = analyze(entries, initial);
  const [dayOpen, setDayOpen] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-5xl">
      {entries.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-panel/50 px-6 py-14 text-center">
          <div className="text-3xl">📊</div>
          <h3 className="mt-3 text-lg font-bold text-ink">Nothing to analyze yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
            Log a few trades in the journal and this page will start painting
            your equity curve, win streaks and monthly P&L.
          </p>
        </div>
      ) : (
        <>
          {/* Stat row */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Stat label="Trades" value={String(m.total)} tone="ink" />
            <Stat label="Win rate" value={`${m.winRate}%`} tone={m.winRate >= 50 ? "mint" : "amber"} />
            <Stat
              label="Profit factor"
              value={m.profitFactor === Infinity ? "∞" : m.profitFactor > 0 ? String(m.profitFactor) : "—"}
              tone={m.profitFactor >= 1.5 ? "mint" : "amber"}
            />
            <Stat
              label="Expectancy"
              value={`${m.expectancy > 0 ? "+" : ""}${moneyCompact(m.expectancy, cur)}`}
              tone={m.expectancy > 0 ? "mint" : "coral"}
            />
            <Stat
              label="Max drawdown"
              value={moneyCompact(m.maxDrawdown, cur)}
              tone="coral"
            />
            <Stat
              label="Net P&L"
              value={`${m.netProfit >= 0 ? "+" : ""}${moneyCompact(m.netProfit, cur)}`}
              tone={m.netProfit >= 0 ? "mint" : "coral"}
            />
          </div>

          {/* Equity curve */}
          <section className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-ink">Equity curve</h3>
              <span className="text-[11px] tabular-nums text-faint">
                start {moneyCompact(initial, cur)} → now{" "}
                <b className="text-mint">{moneyCompact(m.curve[m.curve.length - 1].value, cur)}</b>
              </span>
            </div>
            <div className="mt-4 h-56 w-full sm:h-64">
<EquityChart points={m.curve} />
            </div>
          </section>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Monthly P&L bars */}
            <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
              <h3 className="text-[14px] font-bold text-ink">Monthly P&L</h3>
              <div className="mt-4 flex h-44 items-end gap-2 sm:h-52">
                {m.months.map((mo) => {
                  const max = Math.max(...m.months.map((x) => Math.abs(x.pnl)), 1);
                  const h = Math.max(4, (Math.abs(mo.pnl) / max) * 100);
                  return (
                    <div
                      key={mo.key}
                      className="group flex min-w-0 flex-1 flex-col items-center gap-1"
                      title={`${mo.label}: ${moneyCompact(mo.pnl, cur)}`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full rounded-t-lg transition-colors ${
                          mo.pnl >= 0
                            ? "bg-gradient-to-t from-teal/60 to-mint group-hover:from-teal/80 group-hover:to-mint"
                            : "bg-gradient-to-t from-coral/30/10 to-coral/70 group-hover:to-coral"
                        }`}
                      />
                      <span className="shrink-0 text-[9px] font-semibold text-faint">
                        {mo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Streaks + consistency */}
            <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
              <h3 className="text-[14px] font-bold text-ink">Discipline signals</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Minicard
                  label="Best win streak"
                  value={`${m.maxWinStreak}`}
                  tone="mint"
                />
                <Minicard
                  label="Longest losing run"
                  value={`${m.maxLossStreak}`}
                  tone="coral"
                />
                <Minicard
                  label="Target-hit consistency"
                  value={`${m.consistency}%`}
                  tone={m.consistency >= 70 ? "mint" : "amber"}
                  wide
                />
                <Minicard
                  label="Best day"
                  value={m.bestDay ? `${moneyCompact(m.bestDay.net, cur)} · ${m.bestDay.date}` : "—"}
                  tone="mint"
                  wide
                />
              </div>
              <div className="mt-4 rounded-2xl border border-line bg-panel2/40 p-4">
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-muted">Wins vs losses</span>
                  <span className="text-faint">
                    {m.wins} W · {m.losses} L · {m.total - m.wins - m.losses} breakeven
                  </span>
                </div>
                <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-line">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.wins / Math.max(1, m.total)) * 100}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full bg-mint"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((m.total - m.wins - m.losses) / Math.max(1, m.total)) * 100}%`,
                    }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="h-full bg-line2"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.losses / Math.max(1, m.total)) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="h-full bg-coral"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Activity heatmap */}
          <section className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
            <h3 className="text-[14px] font-bold text-ink">Activity (last 16 weeks)</h3>
            <p className="mt-0.5 text-[11px] text-faint">
              One cell per day — mint = profit, coral = loss, dark = flat
            </p>
            <div className="mt-4 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
              {m.heat.map((c) => {
                const min = Math.min(...m.heat.map((x) => Math.abs(x.net)), 1);
                const intensity = Math.min(1, Math.abs(c.net) / Math.max(8, min));
                const bg =
                  c.net > 0
                    ? `rgba(52,211,153,${0.15 + intensity * 0.75})`
                    : c.net < 0
                      ? `rgba(251,113,133,${0.15 + intensity * 0.65})`
                      : "rgba(29,42,58,0.5)";
                return (
                  <button
                    key={c.date}
                    type="button"
                    onClick={() => c.net !== 0 && setDayOpen(c.date)}
                    title={`${c.date}: ${c.net === 0 ? "flat" : moneyCompact(c.net, cur)}`}
                    className={`h-3.5 w-3.5 rounded-[4px] ${c.net !== 0 ? "cursor-pointer transition-transform hover:scale-125" : "cursor-default"}`}
                    style={{ backgroundColor: bg }}
                  />
                );
              })}
            </div>
          </section>

          <DayModal day={dayOpen} entries={entries} currency={cur} onClose={() => setDayOpen(null)} />
        </>
      )}
    </div>
  );
}

function DayModal({
  day,
  entries,
  currency,
  onClose,
}: {
  day: string | null;
  entries: ReturnType<typeof getJournalEntries>;
  currency: CurrencyKey;
  onClose: () => void;
}) {
  const dayEntries = day
    ? entries
        .filter((e) => e.date === day)
        .sort((a, b) => a.createdAt - b.createdAt)
    : [];
  const dayStart = dayEntries.length > 0 ? dayEntries[0].deposit : 0;
  const net = dayEntries.reduce((s, e) => s + e.profit - e.loss - e.commission, 0);
  const end = dayStart + net;

  return (
    <AnimatePresence>
      {day && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-3xl border border-line bg-panel p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-ink">{day}</h3>
                <p className="mt-0.5 text-[11px] text-faint">
                  {dayEntries.length} trade{dayEntries.length === 1 ? "" : "s"} on this day
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close day detail"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-line text-faint transition-colors hover:bg-panel2 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {dayEntries.length === 0 ? (
              <p className="mt-6 pb-4 text-center text-[13px] text-faint">
                No trades logged on this day.
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-panel2 text-left">
                        <th className="px-3 py-2 font-bold text-muted">Pair</th>
                        <th className="px-3 py-2 text-right font-bold text-mint">Profit</th>
                        <th className="px-3 py-2 text-right font-bold text-coral">Loss</th>
                        <th className="px-3 py-2 text-right font-bold text-muted">Comm</th>
                        <th className="px-3 py-2 text-right font-bold text-ink">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayEntries.map((e) => {
                        const n = e.profit - e.loss - e.commission;
                        return (
                          <tr key={e.id} className="border-t border-line">
                            <td className="px-3 py-2 font-semibold text-ink">{e.pair}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-mint">
                              {money(e.profit, currency)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-coral">
                              {money(e.loss, currency)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted">
                              {money(e.commission, currency)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-bold tabular-nums ${n >= 0 ? "text-mint" : "text-coral"}`}
                            >
                              {n >= 0 ? "+" : "−"}
                              {money(Math.abs(n), currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-line bg-panel2/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">
                      Day start
                    </p>
                    <p className="mt-1 text-[13px] font-bold tabular-nums text-ink">
                      {money(dayStart, currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel2/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">
                      Day result
                    </p>
                    <p
                      className={`mt-1 text-[13px] font-bold tabular-nums ${net >= 0 ? "text-mint" : "text-coral"}`}
                    >
                      {net >= 0 ? "+" : "−"}
                      {money(Math.abs(net), currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-mint/25 bg-mint/10 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-mint">
                      Balance after
                    </p>
                    <p className="mt-1 text-[13px] font-bold tabular-nums text-ink">
                      {money(end, currency)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EquityChart({ points }: { points: CurvePoint[] }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 720;
  const H = 240;
  const stepX = W / (points.length - 1);
  const pts = points.map((p, i) => {
    const x = i * stepX;
    const y = H - ((p.value - min) / span) * (H - 24) - 12;
    return { x, y, ...p };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={W}
          y1={H * f}
          y2={H * f}
          stroke="rgba(120,150,180,0.12)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      ))}
      <path d={area} fill="url(#eqFill)" />
      <path
        d={line}
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.length <= 24 &&
        pts.slice(1).map((p) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#0d151e"
            stroke="#34d399"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
    </svg>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "mint" | "coral" | "amber" | "ink";
}) {
  const color =
    tone === "mint"
      ? "text-mint"
      : tone === "coral"
        ? "text-coral"
        : tone === "amber"
          ? "text-amber"
          : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-panel/70 px-4 py-3 backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className={`mt-1 truncate text-lg font-black tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}

function Minicard({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: string;
  tone: string;
  wide?: boolean;
}) {
  const color =
    tone === "mint" ? "text-mint" : tone === "coral" ? "text-coral" : tone === "amber" ? "text-amber" : "text-ink";
  return (
    <div className={`rounded-2xl border border-line bg-panel2/40 px-4 py-3 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className={`mt-1 truncate text-[15px] font-extrabold tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}