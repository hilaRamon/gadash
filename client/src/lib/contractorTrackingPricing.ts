export const CONTRACTOR_PRICING_FORMS = ["שעתי", "יומי", "לפי דונם"] as const;
export type ContractorPricingForm = (typeof CONTRACTOR_PRICING_FORMS)[number];

export const HOURLY_PRICING: ContractorPricingForm = "שעתי";
export const DAILY_PRICING: ContractorPricingForm = "יומי";
export const DUNAM_PRICING: ContractorPricingForm = "לפי דונם";

export function isHourlyPricing(pricingForm: string): boolean {
  return pricingForm === HOURLY_PRICING;
}

export function isDailyPricing(pricingForm: string): boolean {
  return pricingForm === DAILY_PRICING;
}

export function isDunamPricing(pricingForm: string): boolean {
  return pricingForm === DUNAM_PRICING;
}

export function getContractorUnitPriceLabel(pricingForm: string): string {
  if (isHourlyPricing(pricingForm)) return "מחיר לשעה";
  if (isDunamPricing(pricingForm)) return "מחיר לדונם";
  if (isDailyPricing(pricingForm)) return "מחיר יומי";
  return "מחיר ליחידה";
}

export function getContractorUnitAmountLabel(pricingForm: string): string {
  if (isDunamPricing(pricingForm)) return "כמות דונמים";
  return "כמות יחידות";
}

export function getContractorUnitCustomerPriceLabel(pricingForm: string): string {
  if (isHourlyPricing(pricingForm)) return "מחיר לשעה ללקוח";
  if (isDunamPricing(pricingForm)) return "מחיר לדונם ללקוח";
  if (isDailyPricing(pricingForm)) return "מחיר יומי ללקוח";
  return "מחיר ליחידה ללקוח";
}

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

export function calcCustomerFinalPrice(
  unitCustomerPrice: number,
  unitAmount: number,
): number {
  if (!Number.isFinite(unitCustomerPrice) || !Number.isFinite(unitAmount)) return 0;
  return Number((unitCustomerPrice * unitAmount).toFixed(3));
}

export function resolveCustomerFinalPrice(options: {
  unitPrice: number;
  unitAmount: number;
  unitCustomerPrice: number | null;
}): number {
  const { unitPrice, unitAmount, unitCustomerPrice } = options;
  const contractorFinal = calcFinalPrice(unitPrice, unitAmount);
  if (unitCustomerPrice == null) {
    return contractorFinal;
  }
  return calcCustomerFinalPrice(unitCustomerPrice, unitAmount);
}

export function resolveContractorCustomerUnitPrice(options: {
  unitPrice: unknown;
  unitCustomerPrice: unknown;
}): number {
  const unitCustomerPrice = options.unitCustomerPrice;
  if (unitCustomerPrice != null && unitCustomerPrice !== '') {
    const customerUnit = Number(unitCustomerPrice);
    if (Number.isFinite(customerUnit)) return customerUnit;
  }
  const unitPrice = Number(options.unitPrice ?? 0);
  return Number.isFinite(unitPrice) ? unitPrice : 0;
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
  if (pricingForm === "יומי") {
    return 1;
  }
  const amount = Number(options.unitAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}
