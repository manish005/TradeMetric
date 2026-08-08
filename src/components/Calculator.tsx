"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CalculatorInput, CurrencyKey } from "@/lib/types";
import { computeInterest } from "@/lib/compound";
import { todayISO } from "@/lib/format";
import { fadeUp, panelTransition, stagger } from "@/lib/motion";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsPanel from "@/components/ResultsPanel";
import InfoSection from "@/components/InfoSection";
import { IconCalculator, IconTrendUp } from "@/components/icons";
import CurrencyConverter from "@/components/CurrencyConverter";

const DEFAULTS: CalculatorInput = {
  currency: "dollar",
  amount: 1000,
  percent: 5,
  percentPeriod: "yearly",
  years: 1,
  months: 0,
  days: 0,
  includeWeekends: true,
  reinvestPercent: 100,
  excludeHolidays: false,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  regType: "n",
  regDeposit: 0,
  regDepositPeriod: "monthly",
  oneTimeDeposit: 0,
  oneTimeDepositDate: "",
  regWithdrawal: 0,
  regWithdrawalPeriod: "monthly",
  startDate: todayISO(),
};

function buildParams(input: CalculatorInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set("a", String(input.amount));
  p.set("p", String(input.percent));
  p.set("pp", input.percentPeriod);
  p.set("y", String(input.years));
  p.set("m", String(input.months));
  p.set("d", String(input.days));
  p.set("iw", input.includeWeekends ? "y" : "n");
  p.set("rin", String(input.reinvestPercent));
  p.set("eh", input.excludeHolidays ? "y" : "n");
  p.set("wk", input.weekdays.join(","));
  p.set("rt", input.regType);
  p.set("dep", String(input.regDeposit));
  p.set("depp", input.regDepositPeriod);
  p.set("otd", String(input.oneTimeDeposit));
  p.set("otdd", input.oneTimeDepositDate);
  p.set("rw", String(input.regWithdrawal));
  p.set("rwp", input.regWithdrawalPeriod);
  p.set("sd", input.startDate);
  p.set("c", input.currency);
  return p;
}

function between(low: number, high: number) {
  return (v: string | null, fallback: number): number => {
    if (v == null || v === "") return fallback;
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, low), high);
  };
}

function fromParams(qs: string): Partial<CalculatorInput> {
  const q = new URLSearchParams(qs);
  const clamp = between(0, 1e9);
  const patch: Partial<CalculatorInput> = {};
  if (q.has("a")) patch.amount = clamp(q.get("a")!, DEFAULTS.amount);
  if (q.has("p")) patch.percent = clamp(q.get("p")!, DEFAULTS.percent);
  if (q.has("y")) patch.years = clamp(q.get("y")!, 0);
  if (q.has("m")) patch.months = clamp(q.get("m")!, 0);
  if (q.has("d")) patch.days = clamp(q.get("d")!, 0);
  if (q.has("pp")) {
    const v = q.get("pp")!;
    if (["daily", "weekly", "monthly", "yearly"].includes(v))
      patch.percentPeriod = v as CalculatorInput["percentPeriod"];
  }
  if (q.has("iw")) patch.includeWeekends = q.get("iw") === "y";
  if (q.has("rin")) patch.reinvestPercent = clamp(q.get("rin")!, 100) as number;
  if (q.has("eh")) patch.excludeHolidays = q.get("eh") === "y";
  if (q.has("wk")) {
    const days = (q.get("wk") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => n >= 1 && n <= 7);
    if (days.length > 0) patch.weekdays = [...new Set(days)].sort((a, b) => a - b);
  }
  if (q.has("rt") && ["n", "d", "w"].includes(q.get("rt")!))
    patch.regType = q.get("rt") as CalculatorInput["regType"];
  if (q.has("dep")) patch.regDeposit = clamp(q.get("dep")!, 0) as number;
  if (q.has("depp"))
    patch.regDepositPeriod = q.get("depp") as CalculatorInput["regDepositPeriod"];
  if (q.has("otd")) patch.oneTimeDeposit = clamp(q.get("otd")!, 0) as number;
  if (q.has("otdd")) patch.oneTimeDepositDate = q.get("otdd") ?? "";
  if (q.has("rw")) patch.regWithdrawal = clamp(q.get("rw")!, 0) as number;
  if (q.has("rwp"))
    patch.regWithdrawalPeriod = q.get("rwp") as CalculatorInput["regWithdrawalPeriod"];
  if (q.has("sd")) {
    const v = q.get("sd")!;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) patch.startDate = v;
  }
  if (q.has("c")) {
    const all = ["dollar", "euro", "pound", "rupee", "yen"] as CurrencyKey[];
    if ((all as string[]).includes(q.get("c")!))
      patch.currency = q.get("c") as CurrencyKey;
  }
  return patch;
}

function initialState(): CalculatorInput {
  if (typeof window === "undefined") return DEFAULTS;
  const qs = window.location.search;
  if (!qs) return DEFAULTS;
  return { ...DEFAULTS, ...fromParams(qs) };
}

export default function Calculator() {
  const [input, setInput] = useState<CalculatorInput>(initialState);

  // Update the URL so the calculator can be shared
  useEffect(() => {
    const qs = buildParams(input);
    const url = `${window.location.pathname}?${qs}`;
    window.history.replaceState({}, "", url);
  }, [input]);

  const result = useMemo(() => computeInterest(input), [input]);

  const apply = (patch: Partial<CalculatorInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  return (
    <motion.div
      id="top"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto w-full max-w-[92rem] px-1 pb-16 sm:px-2">
        {/* Calculator */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <motion.section
            id="form"
            variants={fadeUp}
            className="rounded-3xl border border-line bg-panel/70 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur sm:p-7"
          >
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 text-mint ring-1 ring-mint/20">
                <IconCalculator className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-lg font-bold text-ink">Calculator</h2>
            </div>
            <CalculatorForm
              value={input}
              onChange={apply}
            />
          </motion.section>

          <motion.section
            variants={fadeUp}
            custom={0}
            className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7"
          >
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 text-amber ring-1 ring-amber/20">
                <IconTrendUp className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-lg font-bold text-ink">Projection</h2>
            </div>
            <ResultsPanel
              result={result}
              input={{
                years: input.years,
                months: input.months,
                days: input.days,
                reinvestPercent: input.reinvestPercent,
                currency: input.currency,
                amount: input.amount,
              }}
              onReset={() =>
                setInput((prev) => ({
                  ...DEFAULTS,
                  startDate: prev.startDate,
                }))
              }
            />
          </motion.section>
        </motion.div>

        <motion.div {...panelTransition} className="mt-8">
          <CurrencyConverter
            initialValue={result.finalValue}
            initialCurrency={input.currency}
          />
        </motion.div>

        <InfoSection />
      </div>
    </motion.div>
  );
}