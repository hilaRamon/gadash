import type { CollectionDocument } from "../schema/types";
import {
  DEFAULT_TRANSPORT_BILLING,
  TRANSPORT_CUSTOMER_BILLING,
} from "./transportBilling";
import { isUncharged } from "./unbilledTrackingFilters";

export const TRANSPORT_BILLING_ROW_SOURCE = "transport";

export function transportTrackingToContractorBillingRow(
  row: CollectionDocument,
): CollectionDocument {
  const hourlyRate = Number(row.hourlyRate ?? 0);
  const hours = Number(row.hours ?? 0);
  const finalPrice = Number(row.finalPrice ?? 0);

  return {
    ...row,
    billingRowSource: TRANSPORT_BILLING_ROW_SOURCE,
    contractor: String(row.mover ?? ""),
    contractorName: String(row.moverName ?? ""),
    plot: null,
    plotName: "",
    operation: "",
    operationName: "הובלה",
    pricingForm: "שעתי",
    unitPrice: hourlyRate,
    unitCustomerPrice: hourlyRate,
    unitAmount: hours,
    finalPrice,
    customerFinalPrice: finalPrice,
    billing: String(row.billing ?? DEFAULT_TRANSPORT_BILLING),
  };
}

export function isUnbilledTransportForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return (
    isUncharged(row) &&
    String(row.customer ?? "") === customerId &&
    String(row.billing ?? "") === TRANSPORT_CUSTOMER_BILLING
  );
}

export function isTransportBillingRow(row: CollectionDocument): boolean {
  return row.billingRowSource === TRANSPORT_BILLING_ROW_SOURCE;
}
