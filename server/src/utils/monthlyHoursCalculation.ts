import { calcHoursBetween } from './transportTrackingPricing';
import { dateToDayKey } from './monthRange';

export const REGULAR_HOURS_PER_DAY = 8.4;
export const OVERTIME_150_THRESHOLD = 10.4;
const OVERTIME_125_MAX = OVERTIME_150_THRESHOLD - REGULAR_HOURS_PER_DAY;

export type TrackingTimeEntry = {
  date: Date;
  startTime: string;
  endTime: string;
};

export type DailyHoursRow = {
  date: string;
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
};

export type MonthlyHoursResult = {
  days: DailyHoursRow[];
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  totalDaysWorked: number;
};

function roundHours(value: number): number {
  return Number(value.toFixed(3));
}

function splitDayHours(dayTotal: number) {
  const regularHours = Math.min(dayTotal, REGULAR_HOURS_PER_DAY);
  const overtime125Hours = Math.min(
    Math.max(0, dayTotal - REGULAR_HOURS_PER_DAY),
    OVERTIME_125_MAX,
  );
  const overtime150Hours = Math.max(0, dayTotal - OVERTIME_150_THRESHOLD);
  return {
    totalHours: roundHours(dayTotal),
    regularHours: roundHours(regularHours),
    overtime125Hours: roundHours(overtime125Hours),
    overtime150Hours: roundHours(overtime150Hours),
  };
}

export function calculateMonthlyHoursFromTrackings(
  trackings: TrackingTimeEntry[],
): MonthlyHoursResult {
  const byDay = new Map<string, number>();

  for (const tracking of trackings) {
    const dayKey = dateToDayKey(new Date(tracking.date));
    const hours = calcHoursBetween(tracking.startTime, tracking.endTime);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + hours);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayTotal]) => ({
      date,
      ...splitDayHours(dayTotal),
    }));

  const totals = days.reduce(
    (acc, day) => ({
      totalHours: acc.totalHours + day.totalHours,
      regularHours: acc.regularHours + day.regularHours,
      overtime125Hours: acc.overtime125Hours + day.overtime125Hours,
      overtime150Hours: acc.overtime150Hours + day.overtime150Hours,
    }),
    { totalHours: 0, regularHours: 0, overtime125Hours: 0, overtime150Hours: 0 },
  );

  return {
    days,
    totalHours: roundHours(totals.totalHours),
    regularHours: roundHours(totals.regularHours),
    overtime125Hours: roundHours(totals.overtime125Hours),
    overtime150Hours: roundHours(totals.overtime150Hours),
    totalDaysWorked: days.length,
  };
}
