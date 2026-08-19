import type { ApiDocument } from '../types/apiDocument';
import { TRANSPORT_CUSTOMER_BILLING } from '../models/TransportTracking';
import { calcFinalPrice } from './transportTrackingPricing';
import { transportTrackingToApiDocument } from './transportTrackingApiMapper';

export const TRANSPORT_BILLING_ROW_SOURCE = 'transport';

export function transportTrackingToContractorBillingDocument(
  doc: Record<string, unknown>,
): ApiDocument {
  const base = transportTrackingToApiDocument(doc);
  const hourlyRate = Number(doc.hourlyRate ?? 0);
  const hours = Number(doc.hours ?? 0);
  const finalPrice = Number(doc.finalPrice ?? 0);
  const parsedCustomerRate = Number(doc.customerHourlyRate);
  const customerHourlyRate = Number.isFinite(parsedCustomerRate)
    ? parsedCustomerRate
    : hourlyRate;

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
    unitCustomerPrice: customerHourlyRate,
    unitAmount: hours,
    finalPrice,
    customerFinalPrice: calcFinalPrice(customerHourlyRate, hours),
    wasCharged: doc.wasCharged === true,
    billing: String(doc.billing ?? TRANSPORT_CUSTOMER_BILLING),
  };
}

export function transportTrackingToContractorBillingDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(transportTrackingToContractorBillingDocument);
}
