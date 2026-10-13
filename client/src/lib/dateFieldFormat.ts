export const DATE_INVALID_ERROR = "תאריך לא תקין";

export function isValidIsoDate(value: string): boolean {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatTableDate(value: unknown): string {
  if (value == null || value === "") return "";
  const iso = String(value).slice(0, 10);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !isValidIsoDate(iso)) return "";
  return `${match[3]}.${match[2]}.${match[1].slice(-2)}`;
}
