import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
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

export function customerBillingTrackingToApiDocument(
  doc: Record<string, unknown>,
): ApiDocument {
  const base = toApiDocument(doc);
  const customer = toRefParts(doc.customer);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    customer: customer.id,
    customerName: customer.name,
    status: String(doc.status ?? ''),
    paid: doc.paid === true,
    finalPrice: Number(doc.finalPrice ?? 0),
    notes: String(doc.notes ?? ''),
  };
}

export function customerBillingTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(customerBillingTrackingToApiDocument);
}
