import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';

export const GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE =
  'globalTransportAllocation';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
  pricePerDunam?: unknown;
  executedAt?: unknown;
};

function toCustomerParts(value: unknown): { id: string; name: string } {
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

function toChargeParts(value: unknown): {
  id: string;
  pricePerDunam: number;
  date: Date | null;
} {
  const ref = value as PopulatedRef | undefined;
  if (ref && typeof ref === 'object' && ref._id != null) {
    const executedAt =
      ref.executedAt == null ? null : new Date(String(ref.executedAt));
    return {
      id: String(ref._id),
      pricePerDunam: Number(ref.pricePerDunam ?? 0),
      date:
        executedAt && !Number.isNaN(executedAt.getTime()) ? executedAt : null,
    };
  }
  return {
    id: value == null ? '' : String(value),
    pricePerDunam: 0,
    date: null,
  };
}

function formatIsoDate(value: Date | null): string {
  if (value == null) return new Date().toISOString().slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function transportGlobalAllocationToContractorBillingDocument(
  doc: Record<string, unknown>,
): ApiDocument {
  const base = toApiDocument(doc);
  const customer = toCustomerParts(doc.customer);
  const charge = toChargeParts(doc.globalTransportChargeId);
  const dunam = Number(doc.dunam ?? 0);
  const finalPrice = Number(doc.finalPrice ?? 0);
  const pricePerDunam = charge.pricePerDunam;

  return {
    ...base,
    billingRowSource: GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE,
    date: formatIsoDate(charge.date),
    customer: customer.id,
    customerName: customer.name,
    contractor: '',
    contractorName: '',
    plot: null,
    plotName: '',
    operation: '',
    operationName: 'הובלות העונה',
    pricingForm: 'דונם',
    unitPrice: pricePerDunam,
    unitCustomerPrice: pricePerDunam,
    unitAmount: dunam,
    dunam,
    finalPrice,
    customerFinalPrice: finalPrice,
    wasCharged: doc.wasCharged === true,
    globalTransportChargeId: charge.id,
    pricePerDunam,
  };
}

export function transportGlobalAllocationToContractorBillingDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(transportGlobalAllocationToContractorBillingDocument);
}

export function isGlobalTransportAllocationRow(
  row: Record<string, unknown>,
): boolean {
  return row.billingRowSource === GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE;
}
