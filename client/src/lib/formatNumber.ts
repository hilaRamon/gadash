/**
 * Formats a number for display: hides ".00" (and trailing zeros), keeps
 * meaningful fractional digits (e.g. 5.5, 12.25).
 */
export function formatNumber(value: unknown): string {
  const amount = Number(value ?? '');
  if (!Number.isFinite(amount)) return '';

  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const intPart = Math.floor(abs);
  const frac = Math.round((abs - intPart) * 100);

  const intStr = intPart.toLocaleString('he-IL');
  if (frac === 0) return `${sign}${intStr}`;

  const fracStr = String(frac).padStart(2, '0').replace(/0+$/, '');
  return `${sign}${intStr}.${fracStr}`;
}
