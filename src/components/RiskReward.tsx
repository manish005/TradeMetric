"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Field, NumberInput, Segmented, Select } from "@/components/ui";
import { CURRENCIES, money, number, round } from "@/lib/format";
import type { CurrencyKey } from "@/lib/types";
import { convert, loadRates, type RateIso } from "@/lib/rates";
import { IconTarget, IconBars } from "@/components/icons";

const ACCOUNT_ISO: Record<CurrencyKey, RateIso> = {
  dollar: "USD",
  euro: "EUR",
  pound: "GBP",
  rupee: "INR",
  yen: "JPY",
};

type AssetClass = "fx" | "metal" | "crypto";

const PAIRS: Array<{
  symbol: string;
  class: AssetClass;
  quote: RateIso;
  pointSize: number;
  contractPerLot: number;
  priceStep: number;
}> = [
  // Forex
  { symbol: "EURUSD", class: "fx", quote: "USD", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "GBPUSD", class: "fx", quote: "USD", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "AUDUSD", class: "fx", quote: "USD", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "USDJPY", class: "fx", quote: "JPY", pointSize: 0.01, contractPerLot: 100000, priceStep: 0.01 },
  { symbol: "USDINR", class: "fx", quote: "INR", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "USDCHF", class: "fx", quote: "USD", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "USDCAD", class: "fx", quote: "USD", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "EURGBP", class: "fx", quote: "GBP", pointSize: 0.0001, contractPerLot: 100000, priceStep: 0.0001 },
  { symbol: "EURJPY", class: "fx", quote: "JPY", pointSize: 0.01, contractPerLot: 100000, priceStep: 0.01 },
  { symbol: "GBPJPY", class: "fx", quote: "JPY", pointSize: 0.01, contractPerLot: 100000, priceStep: 0.01 },
  // Commodities
  { symbol: "XAUUSD", class: "metal", quote: "USD", pointSize: 0.1, contractPerLot: 100, priceStep: 0.01 },
  { symbol: "XAGUSD", class: "metal", quote: "USD", pointSize: 0.01, contractPerLot: 5000, priceStep: 0.001 },
  // Crypto
  { symbol: "BTCUSD", class: "crypto", quote: "USD", pointSize: 1, contractPerLot: 1, priceStep: 1 },
  { symbol: "ETHUSD", class: "crypto", quote: "USD", pointSize: 0.1, contractPerLot: 1, priceStep: 0.1 },
];

const RATIOS = ["1:1", "1:2", "1:3", "1:4", "1:5"] as const;
type Ratio = (typeof RATIOS)[number];
type Tone = "mint" | "coral" | "amber" | "cyan" | "muted";
type Side = "buy" | "sell";

function ratioValue(r: Ratio): number {
  return Number(r.split(":")[1]);
}

// Auto-lot ladder by USD-equivalent balance:
// < $100 → 0.01 · $100–$200 → 0.01 · $200–$300 → 0.02 · +$100 → +0.01 …and so on
function autoLots(usdEquiv: number): number {
  if (usdEquiv <= 0) return 0.01;
  const tier = Math.max(1, Math.floor(usdEquiv / 100));
  return round(tier * 0.01, 2);
}

export default function RiskReward() {
  const [accountSize, setAccountSize] = useState(10000);
  const [accountCurr, setAccountCurr] = useState<CurrencyKey>("dollar");
  const [symbol, setSymbol] = useState("EURUSD");
  const [side, setSide] = useState<Side>("buy");
  const [lots, setLots] = useState(1);
  const [riskPercent, setRiskPercent] = useState(1);
  const [ratio, setRatio] = useState<Ratio>("1:3");
  const [entry, setEntry] = useState(1.1);
  const [sl, setSl] = useState(1.095);
  const [orders, setOrders] = useState(1);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [lotsLocked, setLotsLocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadRates().then((r) => {
      if (mounted) setRates(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const pair = PAIRS.find((p) => p.symbol === symbol) ?? PAIRS[0];
  const accountIso = ACCOUNT_ISO[accountCurr];
  const activeRates = rates ?? {};
  const ratioN = ratioValue(ratio);

  // Auto-populate lot size from balance (re-applied whenever balance changes)
  const usdEquiv = convert(accountSize, accountIso, "USD", activeRates);
  const autoLotsValue = autoLots(usdEquiv);
  const activeLots = lotsLocked ? lots : autoLotsValue;

  // Derived TP from entry/SL and the selected reward:risk ratio
  const slDist = side === "buy" ? entry - sl : sl - entry;
  const tp = slDist > 0 ? entry + slDist * ratioN * (side === "buy" ? 1 : -1) : entry;
  const hasValid = slDist > 0 && accountSize > 0;

  // Points = price distance / point size
  const slPoints = slDist > 0 ? slDist / pair.pointSize : 0;
  const tpPoints = ratioN * slPoints;

  const quotePerPoint = pair.pointSize * pair.contractPerLot * activeLots;
  const perPointAccount = convert(quotePerPoint, pair.quote, accountIso, activeRates);

  const loss = round(perPointAccount * slPoints, 2);
  const profit = round(perPointAccount * tpPoints, 2);
  const riskAmount = round((accountSize * riskPercent) / 100, 2);

  // Suggested lots that keep max loss at the risk budget
  const lossPerLot =
    convert(pair.pointSize * pair.contractPerLot, pair.quote, accountIso, activeRates) *
    slPoints;
  const suggestedLots =
    lossPerLot > 0 ? round(riskAmount / lossPerLot, 2) : 0;

  // Actual risk % this SL represents against the balance
  const tradeCount = Math.max(1, Math.round(orders) || 1);
  const totalProfit = profit * tradeCount;
  const totalLoss = loss * tradeCount;
  const riskOnBalance =
    accountSize > 0 ? round((totalLoss / accountSize) * 100, 2) : 0;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/15 text-cyan ring-1 ring-cyan/20">
            <IconTarget className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Risk / Reward setup</h2>
            <p className="text-[12px] text-faint">
              Entry · SL · TP → profit &amp; loss in your currency
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Account size">
              <NumberInput
                value={accountSize}
                onChange={setAccountSize}
                min={0}
                prefix={CURRENCIES[accountCurr].symbol}
              />
            </Field>
            <Field label="Account currency">
              <Select
                value={accountCurr}
                onChange={(v) => setAccountCurr(v as CurrencyKey)}
                className="w-full"
              >
                <option value="dollar">USD — US Dollar</option>
                <option value="euro">EUR — Euro</option>
                <option value="pound">GBP — British Pound</option>
                <option value="rupee">INR — Indian Rupee</option>
                <option value="yen">JPY — Japanese Yen</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Market / pair">
              <Select value={symbol} onChange={setSymbol} className="w-full">
                <optgroup label="Forex">
                  {PAIRS.filter((p) => p.class === "fx").map((p) => (
                    <option key={p.symbol} value={p.symbol}>
                      {p.symbol}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Commodities">
                  {PAIRS.filter((p) => p.class === "metal").map((p) => (
                    <option key={p.symbol} value={p.symbol}>
                      {p.symbol}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Crypto">
                  {PAIRS.filter((p) => p.class === "crypto").map((p) => (
                    <option key={p.symbol} value={p.symbol}>
                      {p.symbol}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="Direction">
              <Segmented
                options={[
                  { value: "buy", label: "Buy / Long" },
                  { value: "sell", label: "Sell / Short" },
                ]}
                value={side}
                onChange={setSide}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={`Entry price (${symbol})`}>
              <NumberInput
                value={entry}
                onChange={setEntry}
                step={String(pair.priceStep)}
              />
            </Field>
            <Field label={`Stop loss (${symbol})`}>
              <NumberInput
                value={sl}
                onChange={setSl}
                step={String(pair.priceStep)}
              />
            </Field>
            <Field label="Take profit — auto">
              <div className="flex h-11 items-center rounded-xl border border-mint/30 bg-mint/5 px-3 text-[15px] font-bold tabular-nums text-mint">
                {tp.toFixed(priceDigits(pair))}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Reward : Risk ratio">
              <Segmented
                options={RATIOS.map((r) => ({ value: r, label: r }))}
                value={ratio}
                onChange={setRatio}
              />
            </Field>
            <Field label="Risk % of account">
              <NumberInput
                value={riskPercent}
                onChange={setRiskPercent}
                min={0}
                step="0.25"
                suffix={
                  <span className="pointer-events-none absolute right-3 text-sm font-semibold text-muted">
                    %
                  </span>
                }
                className="pr-8"
              />
            </Field>
            <Field label="Position size (lots)">
              <div className="flex gap-2">
                <NumberInput
                  value={activeLots}
                  onChange={(v) => {
                    setLots(v);
                    setLotsLocked(true);
                  }}
                  min={0}
                  step="0.01"
                />
                <button
                  onClick={() => {
                    setLots(autoLotsValue);
                    setLotsLocked(false);
                  }}
                  title="Auto-set lot size from balance"
                  className={`shrink-0 rounded-xl border px-2.5 text-[11px] font-semibold transition-colors ${
                    lotsLocked
                      ? "border-line bg-panel2 text-faint hover:border-mint/40 hover:text-mint"
                      : "border-mint/30 bg-mint/10 text-mint"
                  }`}
                >
                  {lotsLocked ? "manual · auto" : "auto ✓"}
                </button>
              </div>
            </Field>
            <Field label="No. of orders">
              <NumberInput
                value={tradeCount}
                onChange={(v) => setOrders(Number.isFinite(v) ? Math.max(1, Math.round(v)) : 1)}
                min={1}
                step="1"
                suffix={
                  <span className="pointer-events-none absolute right-3 text-sm font-semibold text-muted">
                    {tradeCount === 1 ? "order" : "orders"}
                  </span>
                }
                className="pr-14"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3 text-[12.5px] leading-relaxed text-muted">
            <span className="font-bold text-cyan">Auto-lot sizing</span> is
            tiered by balance: <b className="text-ink">$100–$200 → 0.01</b>,{" "}
            <b className="text-ink">$200–$300 → 0.02</b>,{" "}
            <b className="text-ink">$300–$400 → 0.03</b> … and so on (+0.01 per
            $100). Your account ≈{" "}
            <b className="text-ink">{money(usdEquiv, "dollar")}</b> → auto lots{" "}
            <b className="text-mint">{String(autoLotsValue)}</b>
            {lotsLocked ? null : <> (applied ✓)</>}
            . Suggested lots for {riskPercent}% risk:{" "}
            <b className="text-mint">
              {suggestedLots > 0 ? String(suggestedLots) : "—"}
            </b>
            . {pair.symbol} 1 point = {number(pair.pointSize, priceDigits(pair))}{" "}
            ({round(pair.pointSize * pair.contractPerLot, 2)} {pair.quote} per
            lot) — {money(perPointAccount, accountCurr)} for your size.
            {pair.symbol === "XAUUSD" && (
              <>
                {" "}
                <b className="text-ink">$1</b> move (10 points) with{" "}
                {money(perPointAccount * 10, accountCurr)} profit.
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 text-mint ring-1 ring-mint/20">
            <IconBars className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-lg font-bold text-ink">Outcome</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[{
              label: `Take profit ${tpPoints > 0 ? `(${round(tpPoints, 1)} pts)` : ""}${tradeCount > 1 ? ` × ${tradeCount}` : ""}`,
              value: money(hasValid ? totalProfit : 0, accountCurr),
              tone: "mint",
            },
            {
              label: `Stop loss ${slPoints > 0 ? `(${round(slPoints, 1)} pts)` : ""}${tradeCount > 1 ? ` × ${tradeCount}` : ""}`,
              value: money(hasValid ? totalLoss : 0, accountCurr),
              tone: "coral",
            },
            {
              label: "Risk amount (from SL)",
              value: money(hasValid ? totalLoss : 0, accountCurr),
              tone: "amber",
            },
            { label: "Reward : Risk", value: `1 : ${ratioN}`, tone: "cyan" },
            {
              label: "Risk % of balance (from SL)",
              value: totalLoss > 0 ? `${riskOnBalance}%` : "—",
              tone: "amber",
            },
            {
              label: `Position size (${pair.symbol === "BTCUSD" || pair.symbol === "ETHUSD" ? "coins" : "lots"})`,
              value: String(activeLots),
              tone: "mint",
            },
            {
              label: `1 point × ${activeLots} lot${activeLots === 1 ? "" : "s"}${tradeCount > 1 ? ` × ${tradeCount} orders` : ""}`,
              value: `${tradeCount > 1 ? `${tradeCount} × ` : ""}${money(perPointAccount, accountCurr)}`,
              tone: "muted",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Stat label={s.label} value={s.value} tone={s.tone as Tone} />
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${symbol}-${side}-${ratio}-${entry}-${sl}-${activeLots}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 rounded-2xl border border-teal/25 bg-teal/5 p-4 text-[13px] leading-relaxed text-muted"
          >
            {!hasValid ? (
              <span>
                Enter an {side === "buy" ? "entry above" : "entry below"} the
                stop loss to see the projection for{" "}
                <span className="font-bold text-ink">{symbol}</span>.
              </span>
            ) : (
              <>
                {side === "buy" ? "Buying" : "Selling"}{" "}
                <span className="font-bold text-ink">{symbol}</span> from{" "}
                {number(entry, priceDigits(pair))} with SL at{" "}
                {number(sl, priceDigits(pair))}: a {ratio} reward target means
                TP at{" "}
                <span className="font-bold text-cyan">
                  {number(tp, priceDigits(pair))}
                </span>{" "}
                → {round(slPoints, 1)} pts risk, {round(tpPoints, 1)} pts
                reward. {tradeCount > 1 ? `${tradeCount} orders × ` : "With "}
                {activeLots} lot{activeLots === 1 ? "" : "s"}, that is ≈{" "}
                <span className="font-bold text-mint">
                  {money(totalProfit, accountCurr)}
                </span>{" "}
                profit vs{" "}
                <span className="font-bold text-coral">
                  {money(totalLoss, accountCurr)}
                </span>{" "}
                loss.
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}

function priceDigits(pair: { pointSize: number }): number {
  const s = String(pair.pointSize);
  const idx = s.indexOf(".");
  return idx === -1 ? 0 : s.length - idx - 1;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const tones: Record<string, string> = {
    mint: "text-mint",
    coral: "text-coral",
    amber: "text-amber",
    cyan: "text-cyan",
    muted: "text-ink",
  };
  return (
    <div className="rounded-2xl border border-line bg-panel2/60 p-4 transition-colors hover:border-teal/30">
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <div className={`mt-1.5 text-xl font-extrabold tabular-nums ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}