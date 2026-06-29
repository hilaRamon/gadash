import type { ApiDocument } from '../types/apiDocument';
import {
  calcFinalPrice,
  resolveCustomerFinalPrice,
} from './contractorTrackingPricing';
import { toApiDocument } from './toApiDocument';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
};

type PopulatedPlotRef = PopulatedRef & {
  customer?: unknown;
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

function toUnitAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function toUnitCustomerPrice(value: unknown): number | null {
  if (value == null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

export function contractorTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const contractor = toRefParts(doc.contractor);
  const plot = toRefParts(doc.plot);
  const plotRaw = doc.plot as PopulatedPlotRef | undefined;
  const customer =
    plotRaw && typeof plotRaw === 'object'
      ? toRefParts(plotRaw.customer)
      : { id: '', name: '' };
  const operation = toRefParts(doc.operation);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  const unitPrice = Number(doc.unitPrice ?? 0);
  const unitAmount = toUnitAmount(doc.unitAmount);
  const unitCustomerPrice = toUnitCustomerPrice(doc.unitCustomerPrice);
  const finalPrice = calcFinalPrice(unitPrice, unitAmount);
  const customerFinalPrice = resolveCustomerFinalPrice({
    unitPrice,
    unitAmount,
    unitCustomerPrice,
  });

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    contractor: contractor.id,
    contractorName: contractor.name,
    plot: plot.id,
    plotName: plot.name,
    customer: customer.id || null,
    customerName: customer.name,
    operation: operation.id,
    operationName: operation.name,
    unitAmount,
    unitCustomerPrice,
    finalPrice,
    customerFinalPrice,
  };
}

export function contractorTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(contractorTrackingToApiDocument);
}
