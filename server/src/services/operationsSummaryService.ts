import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import {
  OPERATION_PRICING_BY_DUNAM,
  OPERATION_PRICING_BY_UNIT,
  OPERATION_PRICING_HOURLY,
  calcFinalPrice,
  resolveOperationAmount,
} from '../utils/operationTrackingPricing';

type PopulatedOperation = {
  _id: unknown;
  name?: string;
  pricingForm?: string | null;
  currentCost?: number | null;
};

type PopulatedPlot = {
  dunam?: number | null;
};

export type OperationsSummaryRow = {
  operationId: string;
  operationName: string;
  pricingForm: 'דונם' | 'שעתי' | 'כמות יחידות' | null;
  currentCost: number;
  totalAmount: number;
  amountUnit: 'דונם' | 'שעות' | 'יחידות';
  totalCharge: number;
};

function pricingFormToAmountUnit(
  pricingForm: string | null | undefined,
): OperationsSummaryRow['amountUnit'] {
  const form = String(pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  if (form === OPERATION_PRICING_HOURLY) return 'שעות';
  if (form === OPERATION_PRICING_BY_UNIT) return 'יחידות';
  return 'דונם';
}

function normalizePricingForm(
  pricingForm: string | null | undefined,
): OperationsSummaryRow['pricingForm'] {
  const form = String(pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  if (form === OPERATION_PRICING_HOURLY) return OPERATION_PRICING_HOURLY;
  if (form === OPERATION_PRICING_BY_UNIT) return OPERATION_PRICING_BY_UNIT;
  if (form === OPERATION_PRICING_BY_DUNAM) return OPERATION_PRICING_BY_DUNAM;
  return null;
}

function resolveTrackingUnitCost(
  row: { unitCost?: number | null },
  operation: PopulatedOperation,
): number {
  const stored = row.unitCost;
  if (stored != null && Number.isFinite(Number(stored))) {
    return Number(stored);
  }
  return Number(operation.currentCost ?? 0);
}

export const operationsSummaryService = {
  async getOperationsSummary(seasonYear: number): Promise<OperationsSummaryRow[]> {
    const rows = await operationTrackingRepository.findAll(seasonYear);
    const aggregated = new Map<string, OperationsSummaryRow>();

    for (const row of rows) {
      if (!row.billable) continue;

      const operation = row.operation as PopulatedOperation | null;
      if (!operation?._id) continue;

      const operationId = String(operation._id);
      const pricingForm = String(operation.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
      const plot = row.plot as PopulatedPlot | null;
      const plotDunam = plot?.dunam != null ? Number(plot.dunam) : null;

      let amount: number | null;
      try {
        amount = resolveOperationAmount(pricingForm, {
          startTime: row.startTime,
          endTime: row.endTime,
          amount: row.amount,
          plotDunam,
        });
      } catch {
        continue;
      }
      if (amount == null) continue;

      const unitCost = resolveTrackingUnitCost(row, operation);
      const charge = calcFinalPrice(unitCost, amount);

      const existing = aggregated.get(operationId);
      if (existing) {
        existing.totalAmount = Number((existing.totalAmount + amount).toFixed(3));
        existing.totalCharge = Number((existing.totalCharge + charge).toFixed(2));
        continue;
      }

      aggregated.set(operationId, {
        operationId,
        operationName: String(operation.name ?? ''),
        pricingForm: normalizePricingForm(operation.pricingForm),
        currentCost: Number(operation.currentCost ?? 0),
        totalAmount: amount,
        amountUnit: pricingFormToAmountUnit(pricingForm),
        totalCharge: charge,
      });
    }

    return [...aggregated.values()].sort((a, b) =>
      a.operationName.localeCompare(b.operationName, 'he'),
    );
  },
};
