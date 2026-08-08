import type {
  CalcResult,
  CalculatorInput,
  DayRun,
  PeriodRow,
  PercentPeriod,
} from "./types";
import { isUSHoliday } from "./holidays.ts";

const MONTHLY_DAYS = 365 / 12;
const MS_PER_DAY = 86400000;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(12, 0, 0, 0);
  return date;
}

function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const whole = Math.floor(months);
  const fraction = months - whole;
  const d = new Date(date);
  d.setMonth(d.getMonth() + whole);
  if (fraction > 0) {
    d.setTime(d.getTime() + Math.round(fraction * MONTHLY_DAYS * MS_PER_DAY));
  }
  return d;
}

function diffInDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dateLabel(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} '${String(
    date.getFullYear()
  ).slice(2)}`;
}

function weekdayIdx(date: Date): number {
  return (date.getDay() + 6) % 7; // 0 = Monday
}

export function dailyRateFor(percent: number, period: PercentPeriod): number {
  const pct = percent / 100;
  switch (period) {
    case "daily":
      return pct;
    case "weekly":
      return pct / 7;
    case "monthly":
      return (pct * 12) / 365;
    case "yearly":
      return pct / 365;
  }
}

function isActiveDay(
  d: Date,
  includeWeekends: boolean,
  weekdays: number[],
  excludeHolidays: boolean
): boolean {
  if (!includeWeekends) {
    const jsDow = d.getDay(); // 0=Sun
    const idx = jsDow === 0 ? 7 : jsDow; // 1=Mon..7=Sun
    if (!weekdays.includes(idx)) return false;
    if (excludeHolidays && isUSHoliday(d)) return false;
  }
  return true;
}

interface DayRunInternal {
  run: DayRun;
  date: Date;
}

interface GroupAcc {
  rows: DayRunInternal[];
  label: string;
  startDate: Date;
  endDate: Date;
  partial: boolean;
}

export function computeInterest(input: CalculatorInput): CalcResult {
  const start = parseDate(input.startDate);
  const end = addDays(
    addMonths(addYears(start, input.years), input.months),
    input.days
  );
  const totalDays = diffInDays(start, end);
  const dailyRate = dailyRateFor(input.percent, input.percentPeriod);
  const reinvest = input.reinvestPercent / 100;

  const runs: DayRunInternal[] = [];
  let balance = input.amount;
  let totalEarnings = 0;
  let totalCashOut = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let businessDays = 0;

  for (let i = 1; i <= totalDays; i++) {
    const d = addDays(start, i);
    const prevDate = addDays(d, -1);
    const isMonthBoundary = prevDate.getMonth() !== d.getMonth();

    let deposit = 0;
    let withdrawal = 0;

    if (input.regType === "d" && input.regDeposit > 0) {
      const period = input.regDepositPeriod;
      const due =
        period === "daily"
          ? isActiveDay(
              d,
              input.includeWeekends,
              input.weekdays,
              input.excludeHolidays
            )
          : period === "weekly"
            ? i % 7 === 0
            : period === "biweekly"
              ? i % 14 === 0
              : isMonthBoundary;
      if (due) deposit = input.regDeposit;
    }
    if (input.regType === "w" && input.regWithdrawal > 0) {
      const period = input.regWithdrawalPeriod;
      const due =
        period === "weekly"
          ? i % 7 === 0
          : period === "biweekly"
            ? i % 14 === 0
            : isMonthBoundary;
      if (due) withdrawal = balance * (input.regWithdrawal / 100);
    }
    if (input.oneTimeDeposit > 0 && input.oneTimeDepositDate) {
      if (toISO(d) === input.oneTimeDepositDate) {
        deposit += input.oneTimeDeposit;
      }
    }

    const isActive = isActiveDay(
      d,
      input.includeWeekends,
      input.weekdays,
      input.excludeHolidays
    );
    if (isActive) businessDays += 1;

    let dayInterest = 0;
    let reinvested = 0;
    let cashOut = 0;

    if (deposit > 0) {
      balance += deposit;
      totalDeposits += deposit;
    }
    if (withdrawal > 0) {
      const applyWithdrawal = Math.min(withdrawal, balance);
      balance -= applyWithdrawal;
      totalWithdrawals += applyWithdrawal;
    }

    if (isActive && balance > 0) {
      dayInterest = balance * dailyRate;
      reinvested = dayInterest * reinvest;
      cashOut = dayInterest - reinvested;
      balance += reinvested;
      totalEarnings += dayInterest;
      totalCashOut += cashOut;
    }

    runs.push({
      run: {
        date: toISO(d),
        dateLabel: dateLabel(d),
        weekday: d.getDay() === 0 ? 7 : d.getDay(),
        isActive,
        deposit,
        withdrawal,
        dayInterest,
        reinvested,
        cashOut,
        totalEarnings,
        balance,
      },
      date: d,
    });
  }

  const finalValue = balance;
  const totalInterest =
    finalValue - input.amount - totalDeposits + totalWithdrawals;
  const percentageProfit =
    input.amount > 0 ? (totalInterest / input.amount) * 100 : 0;
  const apyPct = (Math.pow(1 + dailyRate, 365) - 1) * 100;

  const byDay = groupRows(runs, start, end, "day");
  const byWeek = groupRows(runs, start, end, "week");
  const byMonth = groupRows(runs, start, end, "month");
  const byYear = groupRows(runs, start, end, "year");

  return {
    startDate: toISO(start),
    endDate: toISO(end),
    totalDays,
    businessDays,
    dailyRatePct: dailyRate * 100,
    apyPct,
    finalValue,
    totalInterest,
    totalDeposits,
    totalWithdrawals,
    totalCashOut,
    percentageProfit,
    invested: input.amount,
    runs: runs.map((r) => r.run),
    byDay,
    byWeek,
    byMonth,
    byYear,
  };
}

function groupRows(
  runs: DayRunInternal[],
  start: Date,
  end: Date,
  mode: "day" | "week" | "month" | "year"
): PeriodRow[] {
  const groups: GroupAcc[] = [];

  for (const item of runs) {
    const d = item.date;
    let label: string;
    let gStart: Date;
    let gEnd: Date;
    let partial: boolean;

    if (mode === "day") {
      if (!item.run.isActive) continue;
      groups.push({
        rows: [item],
        label: item.run.dateLabel,
        startDate: d,
        endDate: d,
        partial: false,
      });
      continue;
    } else if (mode === "week") {
      const idx = weekdayIdx(d);
      gStart = addDays(d, -idx);
      gEnd = addDays(gStart, 6);
      label = dateLabel(gEnd);
      partial = gStart.getTime() < start.getTime() || gEnd.getTime() > end.getTime();
    } else if (mode === "month") {
      gStart = new Date(d.getFullYear(), d.getMonth(), 1);
      gEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      label = `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      partial = gStart.getTime() < start.getTime() || gEnd.getTime() > end.getTime();
    } else {
      gStart = new Date(d.getFullYear(), 0, 1);
      gEnd = new Date(d.getFullYear(), 11, 31);
      label = String(d.getFullYear());
      partial = gStart.getTime() < start.getTime() || gEnd.getTime() > end.getTime();
    }

    const last = groups[groups.length - 1];
    if (last && last.startDate.getTime() === gStart.getTime()) {
      last.rows.push(item);
      last.endDate = gEnd;
    } else {
      groups.push({ rows: [item], label, startDate: gStart, endDate: gEnd, partial });
    }
  }

  return groups.map((g) => {
    const sum = (k: "deposit" | "withdrawal" | "dayInterest" | "reinvested" | "cashOut") =>
      g.rows.reduce((s, r) => s + r.run[k], 0);
    const lastRun = g.rows[g.rows.length - 1].run;
    return {
      label: g.label,
      startDate: toISO(g.startDate),
      endDate: toISO(g.endDate),
      deposit: sum("deposit"),
      withdrawal: sum("withdrawal"),
      earnings: sum("dayInterest"),
      reinvested: sum("reinvested"),
      totalEarnings: lastRun.totalEarnings,
      cashOut: sum("cashOut"),
      balance: lastRun.balance,
      partial: g.partial,
    };
  });
}