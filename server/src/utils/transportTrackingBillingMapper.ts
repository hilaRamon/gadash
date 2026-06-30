import type { ApiDocument } from '../types/apiDocument';
import { TRANSPORT_CUSTOMER_BILLING } from '../models/TransportTracking';
import { transportTrackingToApiDocument } from './transportTrackingApiMapper';

export const TRANSPORT_BILLING_ROW_SOURCE = 'transport';

export function transportTrackingToContractorBillingDocument(
  doc: Record<string, unknown>,
): ApiDocument {
  const base = transportTrackingToApiDocument(doc);
  const hourlyRate = Number(doc.hourlyRate ?? 0);
  const hours = Number(doc.hours ?? 0);
  const finalPrice = Number(doc.finalPrice ?? 0);

  return {
    ...base,
    billingRowSource: TRANSPORT_BILLING_ROW_SOURCE,
    contractor: String(base.mover ?? ''),
    contractorName: String(base.moverName ?? ''),
    plot: null,
    plotName: '',
    operation: '',
    operationName: 'הובלה',
    pricingForm: 'שעתי',
    unitPrice: hourlyRate,
    unitCustomerPrice: hourlyRate,
    unitAmount: hours,
    finalPrice,
    customerFinalPrice: finalPrice,
    wasCharged: doc.wasCharged === true,
    billing: String(doc.billing ?? TRANSPORT_CUSTOMER_BILLING),
  };
}

export function transportTrackingToContractorBillingDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(transportTrackingToContractorBillingDocument);
}
