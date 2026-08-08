export type CurrencyKey = "dollar" | "euro" | "pound" | "rupee" | "yen";
export type PercentPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type RegPeriod = "daily" | "weekly" | "biweekly" | "monthly";
export type RegType = "n" | "d" | "w";
export type Breakdown = "day" | "week" | "month" | "year";

export interface CalculatorInput {
  currency: CurrencyKey;
  amount: number;
  percent: number;
  percentPeriod: PercentPeriod;
  years: number;
  months: number;
  days: number;
  includeWeekends: boolean;
  reinvestPercent: number;
  excludeHolidays: boolean;
  weekdays: number[]; // 1 = Mon ... 7 = Sun
  regType: RegType;
  regDeposit: number;
  regDepositPeriod: RegPeriod;
  oneTimeDeposit: number;
  oneTimeDepositDate: string; // YYYY-MM-DD
  regWithdrawal: number;
  regWithdrawalPeriod: RegPeriod;
  startDate: string; // YYYY-MM-DD
}

export interface DayRun {
  date: string; // YYYY-MM-DD
  dateLabel: string; // "14 Aug '26"
  weekday: number; // 1-7 (Mon-Sun)
  isActive: boolean;
  deposit: number;
  withdrawal: number;
  dayInterest: number;
  reinvested: number;
  cashOut: number;
  totalEarnings: number;
  balance: number;
}

export interface PeriodRow {
  label: string;
  startDate: string;
  endDate: string;
  deposit: number;
  withdrawal: number;
  earnings: number;
  reinvested: number;
  totalEarnings: number;
  cashOut: number;
  balance: number;
  partial: boolean;
}

export interface CalcResult {
  startDate: string;
  endDate: string;
  totalDays: number;
  businessDays: number;
  dailyRatePct: number;
  apyPct: number;
  finalValue: number;
  totalInterest: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCashOut: number;
  percentageProfit: number;
  invested: number;
  runs: DayRun[];
  byDay: PeriodRow[];
  byWeek: PeriodRow[];
  byMonth: PeriodRow[];
  byYear: PeriodRow[];
}