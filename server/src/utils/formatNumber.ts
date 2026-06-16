const LTR_ISOLATE_START = '\u2066'
const LTR_ISOLATE_END = '\u2069'

function wrapLtrNumeric(text: string): string {
  if (!text) return text
  return `${LTR_ISOLATE_START}${text}${LTR_ISOLATE_END}`
}

export function formatNumber(value: unknown): string {
  const amount = Number(value ?? '');
  if (!Number.isFinite(amount)) return '';

  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const intPart = Math.floor(abs);
  const frac = Math.round((abs - intPart) * 100);

  const intStr = intPart.toLocaleString('he-IL');
  if (frac === 0) return wrapLtrNumeric(`${sign}${intStr}`);

  const fracStr = String(frac).padStart(2, '0').replace(/0+$/, '');
  return wrapLtrNumeric(`${sign}${intStr}.${fracStr}`);
}
