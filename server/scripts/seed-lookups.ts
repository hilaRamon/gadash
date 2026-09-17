import { Types } from 'mongoose';
import { startOfDay } from '../src/utils/dateRange';
import { getCurrentSeasonYear, getSeasonDateRange } from '../src/utils/seasonRange';

export function asObjectId(value: unknown): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  const id = String(value ?? '');
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
}

export function requireByName<T extends { name?: unknown }>(
  rows: T[],
  name: string,
  label: string,
): T {
  const found = rows.find((row) => String(row.name ?? '') === name);
  if (!found) {
    throw new Error(`${label} not found in DB: ${name}`);
  }
  return found;
}

export function pickAt<T>(rows: T[], index: number): T {
  if (rows.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return rows[index % rows.length];
}

/** Dates in the current agricultural season, walking backward from today. */
export function recentSeasonDate(daysAgo: number): Date {
  const { startDate } = getSeasonDateRange(getCurrentSeasonYear());
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - daysAgo);
  return date < startDate ? new Date(startDate) : date;
}
