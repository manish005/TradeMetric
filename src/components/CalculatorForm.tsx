"use client";

import type { CalculatorInput } from "@/lib/types";
import {
  Chip,
  Field,
  HelpToggle,
  NumberInput,
  Segmented,
  Select,
} from "@/components/ui";
import { CURRENCIES, todayISO } from "@/lib/format";

const WEEKDAYS = [
  { key: 1, label: "M", title: "Monday" },
  { key: 2, label: "T", title: "Tuesday" },
  { key: 3, label: "W", title: "Wednesday" },
  { key: 4, label: "T", title: "Thursday" },
  { key: 5, label: "F", title: "Friday" },
  { key: 6, label: "S", title: "Saturday" },
  { key: 7, label: "S", title: "Sunday" },
];

export default function CalculatorForm({
  value,
  onChange,
}: {
  value: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
}) {
  const currency = CURRENCIES[value.currency];

  const toggleWeekday = (key: number) => {
    const has = value.weekdays.includes(key);
    if (has && value.weekdays.length <= 1) return;
    onChange({
      weekdays: has
        ? value.weekdays.filter((k) => k !== key)
        : [...value.weekdays, key].sort((a, b) => a - b),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Field label="Currency:">
        <Segmented
          options={(Object.keys(CURRENCIES) as (keyof typeof CURRENCIES)[]).map(
            (k) => ({
              value: k,
              label: <span className="text-base">{CURRENCIES[k].symbol}</span>,
            })
          )}
          value={value.currency}
          onChange={(v) => onChange({ currency: v as CalculatorInput["currency"] })}
        />
      </Field>

      <Field label="Principal amount:">
        <NumberInput
          value={value.amount}
          min={0}
          onChange={(v) => onChange({ amount: v })}
          prefix={currency.symbol}
        />
      </Field>

      <Field label="Rate (%):">
        <div className="flex gap-2">
          <NumberInput
            value={value.percent}
            min={0}
            onChange={(v) => onChange({ percent: v })}
            className="flex-1"
          />
          <Select
            value={value.percentPeriod}
            onChange={(v) =>
              onChange({ percentPeriod: v as CalculatorInput["percentPeriod"] })
            }
            className="w-[45%] sm:w-40"
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </Select>
        </div>
      </Field>

      <div className="grid min-w-0 grid-cols-3 gap-2 [&>div]:min-w-0">
        <Field label="Years:">
          <NumberInput value={value.years} min={0} onChange={(v) => onChange({ years: v })} />
        </Field>
        <Field label="Months:">
          <NumberInput value={value.months} min={0} onChange={(v) => onChange({ months: v })} />
        </Field>
        <Field label="Days:">
          <NumberInput value={value.days} min={0} onChange={(v) => onChange({ days: v })} />
        </Field>
      </div>

      <Divider />

      <Field label="Include all days of week?">
        <Segmented
          options={[
            { value: "y", label: "Yes" },
            { value: "n", label: "No" },
          ]}
          value={value.includeWeekends ? "y" : "n"}
          onChange={(v) => onChange({ includeWeekends: v === "y" })}
        />
      </Field>

      <Field
        label="Daily reinvest rate:"
        hint={
          <span className="inline-flex items-center">
            <span
              className={`text-sm font-bold tabular-nums ${
                value.reinvestPercent >= 100 ? "text-mint" : "text-amber"
              }`}
            >
              {value.reinvestPercent}%
            </span>
            <HelpToggle title="About the daily reinvest rate">
              <p className="text-[13px] leading-relaxed text-muted">
                The daily reinvest rate is the % of each day&apos;s earnings you
                keep in the investment for future compounding. The rest is paid
                out in cash as it is earned. Example: reinvesting 80% of a $25
                daily return adds $20 to your balance and withdraws $5.
              </p>
            </HelpToggle>
          </span>
        }
      >
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value.reinvestPercent}
          onChange={(e) => onChange({ reinvestPercent: Number(e.target.value) })}
          className="h-2 w-full"
          aria-label="Daily reinvest rate"
        />
        <div className="mt-1 flex justify-between text-[10px] text-faint">
          <span>0% — cash out everything</span>
          <span>100% — full compounding</span>
        </div>
      </Field>

      {!value.includeWeekends && (
        <div className="animate-rise flex flex-col gap-5 rounded-xl border border-line bg-panel2/60 p-4">
          <Field label="Exclude U.S. holidays & weekends?">
            <Segmented
              options={[
                { value: "n", label: "No" },
                { value: "y", label: "Yes" },
              ]}
              value={value.excludeHolidays ? "y" : "n"}
              onChange={(v) => onChange({ excludeHolidays: v === "y" })}
            />
          </Field>

          {!value.excludeHolidays && (
            <Field label="Days to include:">
              <div className="flex gap-1.5">
                {WEEKDAYS.map((wd) => (
                  <Chip
                    key={wd.key}
                    active={value.weekdays.includes(wd.key)}
                    onClick={() => toggleWeekday(wd.key)}
                  >
                    <span title={wd.title}>{wd.label}</span>
                  </Chip>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}

      <Divider />

      <Field label="Additional contributions:">
        <Segmented
          options={[
            { value: "n", label: "None" },
            { value: "d", label: "Deposits" },
            { value: "w", label: "Withdrawals" },
          ]}
          value={value.regType}
          onChange={(v) => onChange({ regType: v as CalculatorInput["regType"] })}
        />
      </Field>

      {value.regType === "d" && (
        <div className="animate-rise flex flex-col gap-4">
          <Field
            label="Additional deposits"
            hint={
              <HelpToggle title="Additional deposits">
                <p className="text-[13px] leading-relaxed text-muted">
                  Adds regular deposits into the investment. Deposits are
                  credited at the end of each period and start earning interest
                  the following day. One-time extra deposits can be added on a
                  specific date.
                </p>
              </HelpToggle>
            }
          >
            <div className="flex gap-2">
              <NumberInput
                value={value.regDeposit}
                min={0}
                onChange={(v) => onChange({ regDeposit: v })}
                prefix={currency.symbol}
                className="flex-1"
              />
              <Select
                value={value.regDepositPeriod}
                onChange={(v) =>
                  onChange({
                    regDepositPeriod: v as CalculatorInput["regDepositPeriod"],
                  })
                }
                className="w-44"
              >
                <option value="daily">daily (365/yr)</option>
                <option value="weekly">weekly (52/yr)</option>
                <option value="biweekly">bi-weekly (26/yr)</option>
                <option value="monthly">monthly (12/yr)</option>
              </Select>
            </div>
          </Field>

          <Field label="One-time additional deposit:">
            <div className="flex flex-wrap gap-2">
              <NumberInput
                value={value.oneTimeDeposit}
                min={0}
                onChange={(v) => onChange({ oneTimeDeposit: v })}
                prefix={currency.symbol}
                className="w-40"
              />
              <input
                type="date"
                value={value.oneTimeDepositDate}
                onChange={(e) => onChange({ oneTimeDepositDate: e.target.value })}
                className="date-picker-icon h-11 min-w-40 flex-1 rounded-xl border border-line bg-panel2 px-3 text-[15px] text-ink outline-none transition-colors focus:border-mint/70"
                title="YYYY-MM-DD"
              />
            </div>
          </Field>
        </div>
      )}

      {value.regType === "w" && (
        <div className="animate-rise flex flex-col gap-4">
          <Field
            label="Withdraw (% of balance):"
            hint={
              <HelpToggle title="Additional withdrawals">
                <p className="text-[13px] leading-relaxed text-muted">
                  Automatically withdraws a percentage of the current balance
                  on a regular schedule. Withdrawals are capped at the current
                  balance and stop once the investment is exhausted.
                </p>
              </HelpToggle>
            }
          >
            <div className="flex gap-2">
              <NumberInput
                value={value.regWithdrawal}
                min={0}
                step="1"
                onChange={(v) => onChange({ regWithdrawal: v })}
                suffix={
                  <span className="pointer-events-none absolute right-3 text-sm font-semibold text-muted">
                    %
                  </span>
                }
                className="flex-1 pr-8"
              />
              <Select
                value={value.regWithdrawalPeriod}
                onChange={(v) =>
                  onChange({
                    regWithdrawalPeriod: v as CalculatorInput["regWithdrawalPeriod"],
                  })
                }
                className="w-44"
              >
                <option value="weekly">weekly (52/yr)</option>
                <option value="biweekly">bi-weekly (26/yr)</option>
                <option value="monthly">monthly (12/yr)</option>
              </Select>
            </div>
          </Field>
        </div>
      )}

      <Field label="Start date?">
        <div className="flex gap-2">
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="date-picker-icon h-11 flex-1 rounded-xl border border-line bg-panel2 px-3 text-[15px] text-ink outline-none transition-colors focus:border-mint/70"
          />
          <button
            type="button"
            onClick={() => onChange({ startDate: todayISO() })}
            className="inline-flex h-11 items-center rounded-xl border border-line px-3 text-sm font-medium text-muted transition-colors hover:border-cyan/60 hover:text-cyan"
          >
            today
          </button>
        </div>
      </Field>
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}