import type { ContractorPricingForm } from '../models/ContractorTracking';

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

export function calcFinalPrice(unitPrice: number, unitAmount: number): number {
  return Number((unitPrice * unitAmount).toFixed(3));
}

export function resolveUnitAmount(
  pricingForm: ContractorPricingForm,
  options: {
    startTime?: string | null;
    endTime?: string | null;
    unitAmount?: number;
  },
): number {
  if (pricingForm === 'שעתי') {
    const startTime = String(options.startTime ?? '').trim();
    const endTime = String(options.endTime ?? '').trim();
    if (!startTime || !endTime) {
      throw new Error('שעות התחלה וסיום נדרשות לתמחור שעתי');
    }
    return calcHoursBetween(startTime, endTime);
  }

  const amount = Number(options.unitAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('כמות יחידות לא תקינה');
  }
  return amount;
}
