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

const SEASON_STORAGE_KEY = 'gadash:selectedSeason';

export function getCurrentSeasonYear(date = new Date()): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 8 ? year + 1 : year;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getSeasonDateRange(seasonYear: number): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = startOfDay(new Date(seasonYear - 1, 7, 1));
  const endDate = endOfDay(new Date(seasonYear, 6, 31));
  return { startDate, endDate };
}

export function isDateInSeason(dateValue: unknown, seasonYear: number): boolean {
  if (dateValue == null || dateValue === '') return false;
  const date = new Date(String(dateValue));
  if (Number.isNaN(date.getTime())) return false;
  const { startDate, endDate } = getSeasonDateRange(seasonYear);
  return date >= startDate && date <= endDate;
}

export function collectionHasDateField(collection: string): boolean {
  return collection in COLLECTION_DATE_FIELDS;
}

export function readStoredSeasonYear(): number | null {
  try {
    const raw = sessionStorage.getItem(SEASON_STORAGE_KEY);
    if (!raw) return null;
    const year = Number(raw);
    if (!Number.isInteger(year) || year < 2000 || year > 2099) return null;
    return year;
  } catch {
    return null;
  }
}

export function writeStoredSeasonYear(year: number): void {
  try {
    sessionStorage.setItem(SEASON_STORAGE_KEY, String(year));
  } catch {
    // ignore storage errors
  }
}
