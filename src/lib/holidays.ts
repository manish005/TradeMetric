type HolidayRule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "nth"; month: number; nth: number; weekday: 1 | 4 | 5 };

const US_HOLIDAYS: HolidayRule[] = [
  { kind: "fixed", month: 0, day: 1 }, // New Year's Day
  { kind: "nth", month: 0, weekday: 1, nth: 3 }, // MLK Day
  { kind: "nth", month: 1, weekday: 1, nth: 3 }, // Presidents' Day
  { kind: "nth", month: 4, weekday: 1, nth: 5 }, // Memorial Day
  { kind: "fixed", month: 5, day: 19 }, // Juneteenth
  { kind: "fixed", month: 6, day: 4 }, // Independence Day
  { kind: "nth", month: 8, weekday: 1, nth: 1 }, // Labor Day
  { kind: "nth", month: 9, weekday: 1, nth: 2 }, // Columbus Day
  { kind: "fixed", month: 10, day: 11 }, // Veterans Day
  { kind: "nth", month: 10, weekday: 4, nth: 4 }, // Thanksgiving
  { kind: "fixed", month: 11, day: 25 }, // Christmas Day
];

function holidayDateFor(year: number, rule: HolidayRule): Date {
  if (rule.kind === "fixed") {
    const d = new Date(year, rule.month, rule.day);
    // If it falls on a weekend, observe on nearest weekday (Fri before / Mon after).
    const dow = d.getDay();
    if (dow === 0) d.setDate(d.getDate() + 1);
    else if (dow === 6) d.setDate(d.getDate() - 1);
    return d;
  }
  // nth weekday of the month (use 5 = last occurrence)
  const count = rule.nth === 5 ? 5 : rule.nth;
  const target = new Date(year, rule.month, 1);
  let found = 0;
  while (target.getMonth() === rule.month) {
    if (target.getDay() === rule.weekday) {
      found += 1;
      if (found === count) return target;
    }
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function isUSHoliday(date: Date): boolean {
  const year = date.getFullYear();
  return US_HOLIDAYS.some((rule) => {
    const h = holidayDateFor(year, rule);
    return (
      h.getMonth() === date.getMonth() && h.getDate() === date.getDate()
    );
  });
}