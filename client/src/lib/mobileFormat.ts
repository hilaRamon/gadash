const E164_PREFIX = '+972';

export const MOBILE_INVALID_ERROR = 'מספר נייד לא תקין';

function extractNationalDigits(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  let digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('972')) {
    digits = digits.slice(3);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

function isValidNationalDigits(digits: string): boolean {
  if (!digits) return true;

  if (digits.startsWith('5')) {
    return digits.length === 9 && /^5[0-9]\d{7}$/.test(digits);
  }

  if (/^[23489]/.test(digits)) {
    return digits.length >= 8 && digits.length <= 9;
  }

  if (/^7[2-9]/.test(digits)) {
    return digits.length >= 8 && digits.length <= 9;
  }

  return false;
}

export function normalizeMobile(input: string): string {
  const digits = extractNationalDigits(input);
  if (!digits) return '';

  if (!isValidNationalDigits(digits)) {
    throw new Error(MOBILE_INVALID_ERROR);
  }

  return `${E164_PREFIX}${digits}`;
}

export function formatMobileDisplay(e164: string): string {
  const trimmed = e164.trim();
  if (!trimmed) return '';

  try {
    const normalized = normalizeMobile(trimmed);
    const digits = normalized.slice(E164_PREFIX.length);
    const national = `0${digits}`;

    if (digits.startsWith('5') && digits.length === 9) {
      return `${national.slice(0, 3)}-${national.slice(3)}`;
    }

    if (/^0[23489]/.test(national) && national.length >= 9) {
      return `${national.slice(0, 2)}-${national.slice(2)}`;
    }

    return national;
  } catch {
    return trimmed;
  }
}
