import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import {
  OPERATION_PRICING_BY_DUNAM,
  OPERATION_PRICING_BY_UNIT,
  OPERATION_PRICING_HOURLY,
  calcFinalPrice,
  calcHoursBetween,
  resolveOperationAmount,
} from '../utils/operationTrackingPricing';

const ADMIN_OPERATION_TYPE = 'מנהלה';
const MINALA_SUMMARY_OPERATION_ID = '__minala__';

type PopulatedOperation = {
  _id: unknown;
  name?: string;
  pricingForm?: string | null;
  currentCost?: number | null;
  operationType?: string | null;
};

type PopulatedPlot = {
  dunam?: number | null;
};

export type OperationsSummaryRow = {
  operationId: string;
  operationName: string;
  pricingForm: 'דונם' | 'שעתי' | 'כמות יחידות' | null;
  currentCost: number | null;
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

function hasStoredAmount(amount: unknown): amount is number {
  return (
    amount != null &&
    amount !== '' &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= 0
  );
}

function resolveAdminTrackingHours(row: {
  startTime?: string | null;
  endTime?: string | null;
  amount?: number | null;
}): number | null {
  if (hasStoredAmount(row.amount)) {
    return Number(row.amount);
  }
  try {
    return calcHoursBetween(String(row.startTime ?? ''), String(row.endTime ?? ''));
  } catch {
    return null;
  }
}

export const operationsSummaryService = {
  async getOperationsSummary(seasonYear: number): Promise<OperationsSummaryRow[]> {
    const rows = await operationTrackingRepository.findAll(seasonYear);
    const aggregated = new Map<string, OperationsSummaryRow>();
    let minalaHours = 0;
    let minalaCharge = 0;
    let hasMinala = false;

    for (const row of rows) {
      const operation = row.operation as PopulatedOperation | null;
      if (!operation?._id) continue;

      if (String(operation.operationType ?? '') === ADMIN_OPERATION_TYPE) {
        const hours = resolveAdminTrackingHours(row);
        if (hours == null) continue;
        const unitCost =
          row.unitCost != null && Number.isFinite(Number(row.unitCost))
            ? Number(row.unitCost)
            : 0;
        hasMinala = true;
        minalaHours = Number((minalaHours + hours).toFixed(3));
        minalaCharge = Number((minalaCharge + calcFinalPrice(unitCost, hours)).toFixed(2));
        continue;
      }

      if (!row.billable) continue;

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

    const sorted = [...aggregated.values()].sort((a, b) =>
      a.operationName.localeCompare(b.operationName, 'he'),
    );

    if (hasMinala) {
      sorted.push({
        operationId: MINALA_SUMMARY_OPERATION_ID,
        operationName: ADMIN_OPERATION_TYPE,
        pricingForm: OPERATION_PRICING_HOURLY,
        currentCost: null,
        totalAmount: minalaHours,
        amountUnit: 'שעות',
        // Expense (money paid out), not customer charge.
        totalCharge: Number((-minalaCharge).toFixed(2)),
      });
    }

    return sorted;
  },
};
