import type { ApiDocument } from '../types/apiDocument';
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
    customerPrice: doc.customerPrice == null ? null : Number(doc.customerPrice),
  };
}

export function contractorTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(contractorTrackingToApiDocument);
}
