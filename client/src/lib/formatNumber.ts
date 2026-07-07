/**
 * Formats a number for display: hides unnecessary trailing zeros, keeps
 * meaningful fractional digits up to 4 places (e.g. 5.5, 12.25, 0.004).
 * Wrapped in LTR isolates so negative signs render on the left in RTL UI.
 */
const MAX_DECIMALS = 4;
const LTR_ISOLATE_START = '\u2066'
const LTR_ISOLATE_END = '\u2069'

function wrapLtrNumeric(text: string): string {
  if (!text) return text
  return `${LTR_ISOLATE_START}${text}${LTR_ISOLATE_END}`
}

export function formatNumber(value: unknown): string {
  const amount = Number(value ?? '');
  if (!Number.isFinite(amount)) return '';

  const factor = 10 ** MAX_DECIMALS;
  const rounded = Math.round(amount * factor) / factor;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const intPart = Math.floor(abs);
  const frac = Math.round((abs - intPart) * factor);

  const intStr = intPart.toLocaleString('he-IL');
  if (frac === 0) return wrapLtrNumeric(`${sign}${intStr}`);

  const fracStr = String(frac).padStart(MAX_DECIMALS, '0').replace(/0+$/, '');
  return wrapLtrNumeric(`${sign}${intStr}.${fracStr}`);
}

/** Rounds to the nearest integer and formats without a decimal part. */
export function formatWholeNumber(value: unknown): string {
  const amount = Number(value ?? '');
  if (!Number.isFinite(amount)) return '';

  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const intStr = Math.abs(rounded).toLocaleString('he-IL');
  return wrapLtrNumeric(`${sign}${intStr}`);
}

/** Formats with exactly 2 decimal digits for currency-like values. */
export function formatNumber2(value: unknown): string {
  const amount = Number(value ?? '');
  if (!Number.isFinite(amount)) return '';
  return wrapLtrNumeric(amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));
}
