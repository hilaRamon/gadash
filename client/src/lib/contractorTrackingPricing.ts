export const CONTRACTOR_PRICING_FORMS = ["שעתי", "יומי", "לפי דונם"] as const;
export type ContractorPricingForm = (typeof CONTRACTOR_PRICING_FORMS)[number];

function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return null;
  const [hour, minute] = trimmed.split(":").map(Number);
  return hour * 60 + minute;
}

export function calcHoursBetween(startTime: string, endTime: string): number | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null || end <= start) return null;
  return Number(((end - start) / 60).toFixed(3));
}

export function calcFinalPrice(unitPrice: number, unitAmount: number): number {
  if (!Number.isFinite(unitPrice) || !Number.isFinite(unitAmount)) return 0;
  return Number((unitPrice * unitAmount).toFixed(3));
}

export function resolveUnitAmount(
  pricingForm: string,
  options: {
    startTime?: string;
    endTime?: string;
    unitAmount?: string;
  },
): number | null {
  if (pricingForm === "שעתי") {
    return calcHoursBetween(
      String(options.startTime ?? ""),
      String(options.endTime ?? ""),
    );
  }
  const amount = Number(options.unitAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}
