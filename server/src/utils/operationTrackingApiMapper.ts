import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';

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

function calcFinalPrice(doc: Record<string, unknown>): number {
  if (doc.billable === false) return 0;

  const operation = doc.operation as PopulatedOperationRef | undefined;
  const plot = doc.plot as PopulatedPlotRef | undefined;
  if (!operation || typeof operation !== 'object' || !plot || typeof plot !== 'object') {
    return 0;
  }

  const unitCost = Number(operation.currentCost ?? 0);
  const dunam = Number(plot.dunam ?? 0);
  if (!Number.isFinite(unitCost) || !Number.isFinite(dunam) || unitCost < 0 || dunam < 0) {
    return 0;
  }

  return Number((dunam * unitCost).toFixed(2));
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
  const tractor = toRefParts(doc.tractor);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    operation: operation.id,
    operationName: operation.name,
    operationType,
    customer: customer.id,
    customerName: customer.name,
    plot: plot.id,
    plotName: plot.name,
    employee: employee.id,
    employeeName: employee.name,
    tractor: tractor.id,
    tractorName: tractor.name,
    finalPrice: calcFinalPrice(doc),
  };
}

export function operationTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(operationTrackingToApiDocument);
}
