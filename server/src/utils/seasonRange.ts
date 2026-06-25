import { endOfDay, startOfDay } from './dateRange';

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
  return month >= 8 ? year + 1 : year;
}

export function getSeasonDateRange(seasonYear: number): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = startOfDay(new Date(seasonYear - 1, 7, 1));
  const endDate = endOfDay(new Date(seasonYear, 6, 31));
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

export function collectionHasDateField(collection: string): boolean {
  return collection in COLLECTION_DATE_FIELDS;
}
