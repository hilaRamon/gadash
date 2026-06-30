export const DATE_INVALID_ERROR = "תאריך לא תקין";

export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isoToDateDisplay(iso: string): string {
  const trimmed = iso.trim().slice(0, 10);
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return trimmed;

  return `${match[3]}/${match[2]}/${match[1].slice(-2)}`;
}

function parseTwoDigitYear(yy: number): number {
  return yy >= 70 ? 1900 + yy : 2000 + yy;
}

export function parseDateDisplayToIso(display: string): string | null {
  const match = display.trim().match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = parseTwoDigitYear(Number(match[3]));

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isValidDateDisplay(value: string): boolean {
  return parseDateDisplayToIso(value) !== null;
}
