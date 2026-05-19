export type CostHistoryEntryInput = {
  cost: number;
  effectiveFrom: Date;
};

export function deriveCurrentCost(
  history: CostHistoryEntryInput[],
  asOf: Date = new Date(),
): number {
  const applicable = history
    .filter((entry) => entry.effectiveFrom <= asOf)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());

  if (applicable.length === 0) {
    throw new Error('אין מחיר בתוקף לתאריך זה');
  }

  return applicable[0].cost;
}
