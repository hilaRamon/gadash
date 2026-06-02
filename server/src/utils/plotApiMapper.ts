import type { ApiDocument } from '../types/apiDocument';
import type { PlotType } from '../models/Plot';
import { toApiDocument } from './toApiDocument';

type PopulatedCustomer = {
  _id?: unknown;
  name?: string;
};

export function plotToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const customer = doc.customer as PopulatedCustomer | undefined;
  const customerId =
    customer && typeof customer === 'object' && customer._id != null
      ? String(customer._id)
      : doc.customer != null
        ? String(doc.customer)
        : '';

  const customerName =
    customer && typeof customer === 'object' && 'name' in customer
      ? String(customer.name ?? '')
      : '';

  const base = toApiDocument(doc);

  return {
    ...base,
    customer: customerId,
    customerName,
    plotType: (doc.plotType as PlotType | null) ?? null,
  };
}

export function plotsToApiDocuments(docs: Record<string, unknown>[]): ApiDocument[] {
  return docs.map(plotToApiDocument);
}
