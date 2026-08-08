"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CurrencyKey } from "@/lib/types";
import { CURRENCIES, money, round } from "@/lib/format";
import { FALLBACK_RATES, loadRates, type RateIso } from "@/lib/rates";
import { IconGlobe } from "@/components/icons";

const RATE_CURRENCIES: Array<{ iso: RateIso; key: CurrencyKey }> = [
  { iso: "USD", key: "dollar" },
  { iso: "EUR", key: "euro" },
  { iso: "GBP", key: "pound" },
  { iso: "INR", key: "rupee" },
  { iso: "JPY", key: "yen" },
];

function isoOf(currency: CurrencyKey): RateIso {
  return RATE_CURRENCIES.find((x) => x.key === currency)?.iso ?? "USD";
}

export default function CurrencyConverter({
  initialValue,
  initialCurrency,
}: {
  initialValue: number;
  initialCurrency: CurrencyKey;
}) {
  const [amount, setAmount] = useState(initialValue);
  const [base, setBase] = useState<RateIso>(isoOf(initialCurrency));
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadRates().then((r) => {
      if (mounted) setRates(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const baseRate = rates?.[base] ?? FALLBACK_RATES[base];
  const usdAmount = amount / baseRate;

  return (
    <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/15 text-cyan ring-1 ring-cyan/20">
          <IconGlobe className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">
            Currency conversion checker
          </h2>
          <p className="text-[12px] text-faint">
            See your projected value in other currencies — rates via
            open.er-api.com
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-muted">Amount</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={amount === 0 ? "" : amount}
            placeholder="0"
            onChange={(e) => {
              const n = Number(e.target.value);
              setAmount(Number.isFinite(n) ? n : 0);
            }}
            className="h-11 rounded-xl border border-line bg-panel2 px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/70 focus:ring-2 focus:ring-mint/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-muted">From</span>
          <select
            value={base}
            onChange={(e) => setBase(e.target.value as RateIso)}
            className="h-11 rounded-xl border border-line bg-panel2 px-3 text-[14px] text-ink outline-none transition-colors focus:border-mint/70 [&>option]:bg-panel2"
          >
            {RATE_CURRENCIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.iso} — {CURRENCIES[c.key].name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setAmount(initialValue);
            setBase(isoOf(initialCurrency));
          }}
          className="inline-flex h-11 items-center justify-center gap-1.5 self-end rounded-xl border border-line px-4 text-sm font-medium text-muted transition-colors hover:border-mint/60 hover:text-mint"
          title="Reset to your projected final value"
        >
          ⟲ Use projection
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {RATE_CURRENCIES.filter((c) => c.iso !== base).map((c, i) => {
          const targetRate = rates?.[c.iso] ?? FALLBACK_RATES[c.iso];
          const converted = usdAmount * targetRate;
          return (
            <motion.div
              key={c.iso}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="rounded-2xl border border-line bg-panel2/60 p-4 transition-colors hover:border-cyan/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-muted">
                  {c.iso}
                </span>
                <span className="text-[11px] text-faint tabular-nums">
                  1 {base} = {round(targetRate / baseRate, 4)} {c.iso}
                </span>
              </div>
              <div className="mt-1.5 text-xl font-extrabold tabular-nums text-cyan">
                {money(round(converted, 2), c.key)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!rates && (
        <div className="mt-3 text-[12px] text-faint">
          Loading live exchange rates…
        </div>
      )}
    </section>
  );
}