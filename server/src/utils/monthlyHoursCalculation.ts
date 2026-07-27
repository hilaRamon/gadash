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

type MinuteInterval = {
  start: number;
  end: number;
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

function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

export function mergeDayIntervalsHours(intervals: MinuteInterval[]): number {
  if (intervals.length === 0) return 0;

  const sorted = [...intervals].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );
  const merged: MinuteInterval[] = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
      continue;
    }
    last.end = Math.max(last.end, interval.end);
  }

  const totalMinutes = merged.reduce(
    (sum, interval) => sum + (interval.end - interval.start),
    0,
  );
  return totalMinutes / 60;
}

function toMinuteInterval(
  startTime: string,
  endTime: string,
): MinuteInterval | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

export function calculateMonthlyHoursFromTrackings(
  trackings: TrackingTimeEntry[],
): MonthlyHoursResult {
  const intervalsByDay = new Map<string, MinuteInterval[]>();

  for (const tracking of trackings) {
    const interval = toMinuteInterval(tracking.startTime, tracking.endTime);
    if (!interval) continue;

    const dayKey = dateToDayKey(new Date(tracking.date));
    const dayIntervals = intervalsByDay.get(dayKey);
    if (dayIntervals) {
      dayIntervals.push(interval);
    } else {
      intervalsByDay.set(dayKey, [interval]);
    }
  }

  const days = [...intervalsByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, intervals]) => ({
      date,
      ...splitDayHours(mergeDayIntervalsHours(intervals)),
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
