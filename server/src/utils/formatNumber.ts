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
