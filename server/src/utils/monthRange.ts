import { endOfDay, startOfDay } from './dateRange';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertValidMonth(month: unknown): string {
  const raw = String(month ?? '').trim();
  if (!MONTH_PATTERN.test(raw)) {
    throw new Error('חודש לא תקין (YYYY-MM)');
  }
  return raw;
}

export function parseMonth(month: string) {
  const valid = assertValidMonth(month);
  const [yearStr, monthStr] = valid.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const startDate = startOfDay(new Date(year, monthIndex, 1));
  const endDate = endOfDay(new Date(year, monthIndex + 1, 0));
  return { year, monthIndex, startDate, endDate, month: valid };
}

export function dateToMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function dateToDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
