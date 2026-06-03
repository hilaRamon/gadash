export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function defaultPeriodStartDate(): Date {
  const now = new Date();
  return startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function parsePeriodStartDate(value: unknown): Date {
  if (value == null || value === '') {
    throw new Error('תאריך התחלה הוא שדה חובה');
  }
  const raw = String(value).trim();
  const date = raw.length === 10 ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך התחלה לא תקין');
  }
  return startOfDay(date);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
