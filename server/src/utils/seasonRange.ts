import { endOfDay, startOfDay } from './dateRange';
import { parseMonth } from './monthRange';

const SEASON_YEAR_PATTERN = /^20\d{2}$/;

export const COLLECTION_DATE_FIELDS = {
  operationsTrackings: 'date',
  materialUsageTrackings: 'date',
  materialPurchaseTrackings: 'date',
  fuelOperationsTrackings: 'date',
  contractorTrackings: 'date',
  transportTrackings: 'date',
  baleOrderTrackings: 'date',
  customerBillingTrackings: 'date',
} as const;

export type SeasonFilterableCollection = keyof typeof COLLECTION_DATE_FIELDS;

export function getCurrentSeasonYear(date = new Date()): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 9 ? year + 1 : year;
}

export function getSeasonDateRange(seasonYear: number): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = startOfDay(new Date(seasonYear - 1, 8, 1));
  const endDate = endOfDay(new Date(seasonYear, 7, 31));
  return { startDate, endDate };
}

export function parseSeasonYear(value: unknown): number | undefined {
  const raw = String(value ?? '').trim();
  if (!raw || !SEASON_YEAR_PATTERN.test(raw)) return undefined;
  return Number(raw);
}

export function parseSeasonQuery(
  query: Record<string, unknown>,
): number | undefined {
  return parseSeasonYear(query.season);
}

export function buildSeasonDateQuery(seasonYear: number): {
  date: { $gte: Date; $lte: Date };
} {
  const { startDate, endDate } = getSeasonDateRange(seasonYear);
  return { date: { $gte: startDate, $lte: endDate } };
}

function intersectDateRanges(
  a: { startDate: Date; endDate: Date },
  b: { startDate: Date; endDate: Date },
): { startDate: Date; endDate: Date } | null {
  const startDate = a.startDate > b.startDate ? a.startDate : b.startDate;
  const endDate = a.endDate < b.endDate ? a.endDate : b.endDate;
  if (startDate.getTime() > endDate.getTime()) return null;
  return { startDate, endDate };
}

/** Season range narrowed to one calendar month. Null when the month is outside the season. */
export function buildSeasonMonthDateQuery(
  seasonYear: number,
  month: string,
): { date: { $gte: Date; $lte: Date } } | null {
  const overlap = intersectDateRanges(
    getSeasonDateRange(seasonYear),
    parseMonth(month),
  );
  if (!overlap) return null;
  return { date: { $gte: overlap.startDate, $lte: overlap.endDate } };
}

export function collectionHasDateField(collection: string): boolean {
  return collection in COLLECTION_DATE_FIELDS;
}
