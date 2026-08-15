"use client";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/settings";
import { money, moneyCompact, round } from "@/lib/format";
import type { CurrencyKey } from "@/lib/types";
import {
  getInitialBalance,
  getJournalEntries,
  getJournalVersion,
  getProjected,
  subscribeJournal,
  today,
} from "@/lib/journal";
import { getGoals, getGoalsVersion, subscribeGoals } from "@/lib/goals";
import { analyze, currentBalance } from "@/lib/analysis";
import {
  IconCalendar,
  IconTarget,
  IconTrendUp,
  IconBars,
} from "@/components/icons";

function Sparkline({
  points,
  height = 64,
}: {
  points: { date: string; value: number }[];
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-line bg-panel2/30 text-[11px] text-faint"
        style={{ height }}
      >
        No journal data yet — log trades to see your curve
      </div>
    );
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 640;
  const H = 160;
  const stepX = W / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = H - ((p.value - min) / span) * (H - 12) - 6;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = H - ((points[points.length - 1].value - min) / span) * (H - 12) - 6;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#sparkFill)" />
      <path
        d={path}
        fill="none"
        stroke="#34d399"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={W}
        cy={lastY}
        r={5}
        fill="#34d399"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function OverviewView() {
  useSyncExternalStore(subscribeJournal, getJournalVersion);
  useSyncExternalStore(subscribeGoals, getGoalsVersion);
  const { currency } = useSettings();
  const cur = currency as CurrencyKey;

  const entries = getJournalEntries();
  const initial = getInitialBalance();
  const projected = getProjected();
  const metrics = analyze(entries, initial);
  const balance = currentBalance(entries, initial);
  const goals = getGoals();
  const tKey = today();

  const targetToday = projected.date === tKey ? projected.target : 0;
  const todayEntry = entries.find((e) => e.date === tKey);
  const todayNet = todayEntry ? round(todayEntry.profit - todayEntry.loss - todayEntry.commission, 2) : 0;
  const targetPct = targetToday > 0 ? round(Math.min(100, (todayNet / targetToday) * 100), 0) : 0;

  const nextGoal = goals
    .filter((g) => !g.done && balance < g.target)
    .sort((a, b) => a.target - b.target)[0];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[11px] font-bold text-mint">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>

      {/* Big stat row */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon={<IconBars className="h-4.5 w-4.5" />}
          label="Current balance"
          value={money(balance, cur)}
          sub={
            initial > 0
              ? `${metrics.netProfit >= 0 ? "+" : ""}${moneyCompact(metrics.netProfit, cur)} P&L all-time`
              : "Set your deposit in Journal"
          }
          tone={metrics.netProfit >= 0 ? "mint" : "coral"}
        />
        <Card
          icon={<IconTarget className="h-4.5 w-4.5" />}
          label="Today's target"
          value={targetToday > 0 ? money(targetToday, cur) : "—"}
          sub={
            targetToday > 0
              ? `from compound calculator · ${targetPct}% filled`
              : "Run the compound calculator to set it"
          }
          tone="amber"
        />
        <Card
          icon={<IconCalendar className="h-4.5 w-4.5" />}
          label="Today's P&L"
          value={todayEntry ? `${todayNet >= 0 ? "+" : ""}${money(todayNet, cur)}` : "—"}
          sub={
            todayEntry
              ? todayEntry.achieved
                ? "Target achieved ✓"
                : `missed target by ${money(Math.max(0, targetToday - todayNet), cur)}`
              : "No trade logged today yet"
          }
          tone={todayNet >= 0 ? "mint" : "coral"}
        />
        <Card
          icon={<IconTrendUp className="h-4.5 w-4.5" />}
          label="Consistency"
          value={`${metrics.consistency}%`}
          sub={`${metrics.currentStreak > 0 ? `${metrics.currentStreak} wins in a row` : "hit targets to build streak"}`}
          tone={metrics.consistency >= 70 ? "cyan" : "amber"}
        />
      </div>

      {/* Equity + goal */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-ink">Balance curve</h3>
            <span className="text-[11px] text-faint">
              {metrics.curve.length > 1
                ? `${metrics.curve.length - 1} journal day${metrics.curve.length - 1 === 1 ? "" : "s"}`
                : "equity"}
            </span>
          </div>
          <div className="mt-3 h-24 w-full sm:h-28">
            <Sparkline points={metrics.curve} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-faint">
            <span>
              Start:{" "}
              <b className="tabular-nums text-muted">{money(initial, cur)}</b>
            </span>
            <span>
              Now: <b className="tabular-nums text-mint">{money(balance, cur)}</b>
            </span>
            {metrics.maxDrawdown > 0 && (
              <span>
                Max drawdown:{" "}
                <b className="tabular-nums text-coral">
                  {moneyCompact(metrics.maxDrawdown, cur)}
                </b>
              </span>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur">
          <h3 className="text-[14px] font-bold text-ink">Next milestone</h3>
          {nextGoal ? (
            <div className="mt-3">
              <div className="text-[13px] font-semibold text-ink">
                {nextGoal.title}
              </div>
              <div className="mt-1 text-[12px] text-muted">
                {money(balance, cur)} /{" "}
                <b className="tabular-nums text-ink">{money(nextGoal.target, cur)}</b>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${round(Math.min(100, (balance / nextGoal.target) * 100), 1)}%`,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-amber to-teal"
                />
              </div>
              <p className="mt-2 text-[11px] text-faint">
                {moneyCompact(round(Math.max(0, nextGoal.target - balance), 2), cur)} to go
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-line bg-panel2/40 px-4 py-6 text-center text-[12px] text-faint">
              {goals.length
                ? "All goals reached — set a bigger one in Profile."
                : "No goals yet — set your first milestone in Profile."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  const vColor =
    tone === "mint"
      ? "text-mint"
      : tone === "coral"
        ? "text-coral"
        : tone === "amber"
          ? "text-amber"
          : "text-cyan";
  return (
    <div className="rounded-3xl border border-line bg-panel/70 p-4 backdrop-blur transition-colors hover:border-mint/25">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint/10 text-mint ring-1 ring-mint/20">
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-faint">
          {label}
        </span>
      </div>
      <div className={`mt-2 truncate text-2xl font-black tabular-nums ${vColor}`}>
        {value}
      </div>
      <div className="mt-1 truncate text-[11px] text-faint">{sub}</div>
    </div>
  );
}