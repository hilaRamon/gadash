import type { ApiDocument } from '../types/apiDocument';
import { calcBaleOrderFinalPrice, resolveBaleOrderPrices } from './baleOrderPricing';
import { toApiDocument } from './toApiDocument';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
  pricePerTon?: unknown;
  pricePerUnit?: unknown;
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

function toBalePrices(value: unknown): PopulatedRef | null {
  if (!value || typeof value !== 'object') return null;
  return value as PopulatedRef;
}

export function baleOrderTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const baleRef = toBalePrices(doc.bale);
  const bale = toRefParts(doc.bale);
  const customer = toRefParts(doc.customer);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));
  const { pricePerTon, pricePerUnit } = resolveBaleOrderPrices({
    pricePerTon: doc.pricePerTon,
    pricePerUnit: doc.pricePerUnit,
    bale: baleRef,
  });
  const finalPrice = calcBaleOrderFinalPrice({
    quantity: doc.quantity,
    weight: doc.weight,
    pricePerTon,
    pricePerUnit,
    transportPrice: doc.transportPrice,
  });

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    bale: bale.id,
    baleName: bale.name,
    customer: customer.id,
    customerName: customer.name,
    pricePerTon,
    pricePerUnit,
    transportPrice: doc.transportPrice,
    finalPrice,
    weighed: doc.weighed === true,
    wasCharged: doc.wasCharged === true,
  };
}

export function baleOrderTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(baleOrderTrackingToApiDocument);
}
