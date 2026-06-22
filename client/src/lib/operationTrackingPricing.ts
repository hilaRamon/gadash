export const OPERATION_PRICING_BY_DUNAM = "דונם" as const;
export const OPERATION_PRICING_HOURLY = "שעתי" as const;
export const OPERATION_PRICING_BY_UNIT = "כמות יחידות" as const;

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

export function calcFinalPrice(unitCost: number, amount: number): number {
  if (!Number.isFinite(unitCost) || !Number.isFinite(amount)) return 0;
  return Number((unitCost * amount).toFixed(2));
}

function hasStoredAmount(amount: unknown): boolean {
  return amount != null && amount !== "" && Number.isFinite(Number(amount)) && Number(amount) >= 0;
}

export function resolveOperationAmount(
  pricingForm: string,
  options: {
    startTime?: string;
    endTime?: string;
    amount?: string | number | null;
    plotDunam?: number | null;
  },
): number | null {
  const form = String(pricingForm || OPERATION_PRICING_BY_DUNAM);

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
    return calcHoursBetween(
      String(options.startTime ?? ""),
      String(options.endTime ?? ""),
    );
  }

  if (hasStoredAmount(options.amount)) {
    return Number(options.amount);
  }
  return null;
}

export function suggestOperationAmount(
  pricingForm: string,
  options: {
    startTime?: string;
    endTime?: string;
    plotDunam?: number | null;
  },
): number | null {
  if (pricingForm === OPERATION_PRICING_BY_DUNAM) {
    if (options.plotDunam != null && Number.isFinite(Number(options.plotDunam))) {
      return Number(options.plotDunam);
    }
    return null;
  }
  if (pricingForm === OPERATION_PRICING_HOURLY) {
    return calcHoursBetween(
      String(options.startTime ?? ""),
      String(options.endTime ?? ""),
    );
  }
  return null;
}
