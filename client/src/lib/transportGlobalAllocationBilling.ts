import type { CollectionDocument } from "@/schema/types";
import { isUncharged } from "./unbilledTrackingFilters";

export const GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE =
  "globalTransportAllocation";

function formatIsoDate(value: unknown): string {
  const date = value == null ? new Date() : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function transportGlobalAllocationToContractorBillingRow(
  row: CollectionDocument,
  pricePerDunam: number,
  executedAt?: unknown,
): CollectionDocument {
  const dunam = Number(row.dunam ?? 0);
  const finalPrice = Number(row.finalPrice ?? 0);
  const rate = Number.isFinite(pricePerDunam) ? pricePerDunam : 0;

  return {
    ...row,
    billingRowSource: GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE,
    date: formatIsoDate(executedAt ?? row.date),
    contractor: "",
    contractorName: "",
    plot: null,
    plotName: "",
    operation: "",
    operationName: "הובלות העונה",
    pricingForm: "דונם",
    unitPrice: rate,
    unitCustomerPrice: rate,
    unitAmount: dunam,
    finalPrice,
    customerFinalPrice: finalPrice,
    pricePerDunam: rate,
    wasCharged: row.wasCharged === true,
  };
}

export function isUnbilledGlobalTransportAllocationForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return isUncharged(row) && String(row.customer ?? "") === customerId;
}

export function isGlobalTransportAllocationRow(
  row: CollectionDocument,
): boolean {
  return row.billingRowSource === GLOBAL_TRANSPORT_ALLOCATION_ROW_SOURCE;
}
