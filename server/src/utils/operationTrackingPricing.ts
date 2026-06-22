import type { PricingForm } from '../models/Operation';

export const OPERATION_PRICING_BY_DUNAM = 'דונם' as const;
export const OPERATION_PRICING_HOURLY = 'שעתי' as const;
export const OPERATION_PRICING_BY_UNIT = 'כמות יחידות' as const;

function parseTimeToMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function calcHoursBetween(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (end <= start) {
    throw new Error('שעת סיום חייבת להיות אחרי שעת התחלה');
  }
  return Number(((end - start) / 60).toFixed(3));
}

export function calcFinalPrice(unitCost: number, amount: number): number {
  return Number((unitCost * amount).toFixed(2));
}

function hasStoredAmount(amount: unknown): amount is number {
  return amount != null && amount !== '' && Number.isFinite(Number(amount)) && Number(amount) >= 0;
}

export function resolveOperationAmount(
  pricingForm: string,
  options: {
    startTime?: string | null;
    endTime?: string | null;
    amount?: number | null;
    plotDunam?: number | null;
  },
): number | null {
  const form = String(pricingForm ?? OPERATION_PRICING_BY_DUNAM);

  if (form === OPERATION_PRICING_BY_DUNAM) {
    if (hasStoredAmount(options.amount)) {
      return Number(options.amount);
    }
    if (options.plotDunam != null && Number.isFinite(Number(options.plotDunam))) {
      return Number(options.plotDunam);
    }
    return null;
  }

  if (form === OPERATION_PRICING_HOURLY) {
    if (hasStoredAmount(options.amount)) {
      return Number(options.amount);
    }
    const startTime = String(options.startTime ?? '').trim();
    const endTime = String(options.endTime ?? '').trim();
    if (!startTime || !endTime) {
      return null;
    }
    return calcHoursBetween(startTime, endTime);
  }

  if (hasStoredAmount(options.amount)) {
    return Number(options.amount);
  }
  return null;
}

export function requireOperationAmount(
  pricingForm: PricingForm | string,
  options: {
    startTime?: string | null;
    endTime?: string | null;
    amount?: number | null;
    plotDunam?: number | null;
  },
): number {
  const resolved = resolveOperationAmount(pricingForm, options);
  if (resolved == null || !Number.isFinite(resolved) || resolved < 0) {
    if (String(pricingForm) === OPERATION_PRICING_BY_UNIT) {
      throw new Error('כמות לא תקינה');
    }
    if (String(pricingForm) === OPERATION_PRICING_HOURLY) {
      throw new Error('שעות לא תקינות');
    }
    throw new Error('כמות לא תקינה');
  }
  return resolved;
}
