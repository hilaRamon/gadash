import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';
import {
  calcFinalPrice,
  resolveOperationAmount,
} from './operationTrackingPricing';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
};

type PopulatedPlotRef = PopulatedRef & {
  customer?: unknown;
  dunam?: unknown;
};

type PopulatedOperationRef = PopulatedRef & {
  operationType?: unknown;
  currentCost?: unknown;
  pricingForm?: unknown;
};

function toRefParts(value: unknown): { id: string; name: string } {
  const ref = value as PopulatedRef | undefined;
  if (ref && typeof ref === 'object' && ref._id != null) {
    return {
      id: String(ref._id),
      name: String(ref.name ?? ''),
    };
  }
  return {
    id: value == null ? '' : String(value),
    name: '',
  };
}

function resolveTrackingUnitCost(
  doc: Record<string, unknown>,
  operationRaw: PopulatedOperationRef | undefined,
): number {
  const stored = doc.unitCost;
  if (stored != null && stored !== '' && Number.isFinite(Number(stored))) {
    return Number(stored);
  }
  if (operationRaw && typeof operationRaw === 'object') {
    return Number(operationRaw.currentCost ?? 0);
  }
  return 0;
}

function resolvePlotDunam(plotRaw: PopulatedPlotRef | undefined): number | null {
  if (!plotRaw || typeof plotRaw !== 'object') return null;
  const dunam = Number(plotRaw.dunam ?? 0);
  return Number.isFinite(dunam) ? dunam : null;
}

function resolveTrackingAmount(
  doc: Record<string, unknown>,
  operationRaw: PopulatedOperationRef | undefined,
  plotRaw: PopulatedPlotRef | undefined,
): number | null {
  const pricingForm =
    operationRaw && typeof operationRaw === 'object'
      ? String(operationRaw.pricingForm ?? 'דונם')
      : 'דונם';

  return resolveOperationAmount(pricingForm, {
    startTime: String(doc.startTime ?? ''),
    endTime: String(doc.endTime ?? ''),
    amount:
      doc.amount == null || doc.amount === ''
        ? null
        : Number(doc.amount),
    plotDunam: resolvePlotDunam(plotRaw),
  });
}

function calcOperationFinalPrice(
  doc: Record<string, unknown>,
  operationRaw: PopulatedOperationRef | undefined,
  plotRaw: PopulatedPlotRef | undefined,
): number {
  if (doc.billable === false) return 0;
  if (!operationRaw || typeof operationRaw !== 'object') return 0;

  const unitCost = resolveTrackingUnitCost(doc, operationRaw);
  const amount = resolveTrackingAmount(doc, operationRaw, plotRaw);
  if (amount == null || !Number.isFinite(unitCost) || unitCost < 0 || amount < 0) {
    return 0;
  }

  return calcFinalPrice(unitCost, amount);
}

export function operationTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const operation = toRefParts(doc.operation);
  const operationRaw = doc.operation as PopulatedOperationRef | undefined;
  const operationType =
    operationRaw && typeof operationRaw === 'object'
      ? String(operationRaw.operationType ?? '')
      : '';
  const plot = toRefParts(doc.plot);
  const plotRaw = doc.plot as PopulatedPlotRef | undefined;
  const customer =
    plotRaw && typeof plotRaw === 'object'
      ? toRefParts(plotRaw.customer)
      : { id: '', name: '' };
  const employee = toRefParts(doc.employee);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));
  const unitCost = resolveTrackingUnitCost(doc, operationRaw);
  const amount = resolveTrackingAmount(doc, operationRaw, plotRaw);

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    operation: operation.id,
    operationName: operation.name,
    operationType,
    customer: customer.id || null,
    customerName: customer.name,
    plot: plot.id || null,
    plotName: plot.name || null,
    employee: employee.id,
    employeeName: employee.name,
    unitCost,
    amount,
    pricingForm:
      operationRaw && typeof operationRaw === 'object'
        ? String(operationRaw.pricingForm ?? 'דונם')
        : 'דונם',
    finalPrice: calcOperationFinalPrice(doc, operationRaw, plotRaw),
  };
}

export function operationTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(operationTrackingToApiDocument);
}
