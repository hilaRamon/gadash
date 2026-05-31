export type MaterialPricingEntryInput = {
  cost: number;
  percent: number;
  effectiveFrom: Date;
};

export function deriveCurrentPricing(
  history: MaterialPricingEntryInput[],
  asOf: Date = new Date(),
): { cost: number; percent: number } {
  const applicable = history
    .filter((entry) => entry.effectiveFrom <= asOf)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());

  if (applicable.length === 0) {
    throw new Error('אין מחיר בתוקף לתאריך זה');
  }

  return { cost: applicable[0].cost, percent: applicable[0].percent };
}

export function calcCustomerCost(cost: number, percent: number): number {
  const value = cost * (1 + percent / 100);
  return Number(value.toFixed(3));
}
