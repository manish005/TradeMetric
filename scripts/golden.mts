import { computeInterest } from "../src/lib/compound.ts";
import type { CalculatorInput } from "../src/lib/types.ts";

function mk(over: Partial<CalculatorInput>): CalculatorInput {
  return {
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
    startDate: "2026-08-07",
    ...over,
  };
}

// Values captured from the reference site live API responses.
const checks: Array<{
  name: string;
  input: CalculatorInput;
  field: keyof ReturnType<typeof computeInterest>;
  expect: number;
}> = [
  { name: "5% yearly, 1y, all days → final value", input: mk({}), field: "finalValue", expect: 1051.27 },
  { name: "5% yearly, 1y, all days → interest", input: mk({}), field: "totalInterest", expect: 51.27 },
  { name: "5% yearly, 1y, all days → days", input: mk({}), field: "totalDays", expect: 365 },
  { name: "5% yearly, 1y, all days → APY", input: mk({}), field: "apyPct", expect: 5.13 },
  { name: "exclude weekends Mon-Fri → final", input: mk({ includeWeekends: false, weekdays: [1, 2, 3, 4, 5] }), field: "finalValue", expect: 1036.26 },
  { name: "exclude weekends → business days", input: mk({ includeWeekends: false, weekdays: [1, 2, 3, 4, 5] }), field: "businessDays", expect: 260 },
  { name: "monthly deposits $100 → final", input: mk({ regType: "d", regDeposit: 100, regDepositPeriod: "monthly" }), field: "finalValue", expect: 2280.37 },
  { name: "monthly deposits → interest", input: mk({ regType: "d", regDeposit: 100, regDepositPeriod: "monthly" }), field: "totalInterest", expect: 80.37 },
  { name: "0.5% daily reinvest 80% day1 → balance", input: mk({ amount: 5000, percent: 0.5, percentPeriod: "daily", years: 0, months: 0, days: 1, reinvestPercent: 80 }), field: "finalValue", expect: 5020 },
  { name: "0.5% daily reinvest 80% day1 → cash out", input: mk({ amount: 5000, percent: 0.5, percentPeriod: "daily", years: 0, months: 0, days: 1, reinvestPercent: 80 }), field: "totalCashOut", expect: 5 },
];

let failures = 0;
for (const c of checks) {
  const r = computeInterest(c.input);
  const actual = r[c.field] as number;
  const ok = Math.abs(actual - c.expect) < 0.02;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${c.name}: ${actual.toFixed(2)} (expect ${c.expect.toFixed(2)})`
  );
}
console.log(
  failures === 0 ? "\nAll golden checks passed." : `\n${failures} check(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);