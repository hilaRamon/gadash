import type { CollectionDocument } from "../schema/types";
import { plotsSeedData } from "../data/plotsSeed";

export function isUncharged(row: CollectionDocument): boolean {
  return row.wasCharged !== true;
}

export function isBillable(row: CollectionDocument): boolean {
  return row.billable !== false;
}

export function isFuelOperation(row: CollectionDocument): boolean {
  return String(row.operationType ?? "") === "דלק";
}

export function getPlotCustomerId(plotId: unknown): string {
  if (plotId == null || plotId === "") return "";
  const plot = plotsSeedData.find((p) => String(p._id) === String(plotId));
  return String(plot?.customer ?? "");
}

export function rowBelongsToCustomer(
  row: CollectionDocument,
  customerId: string,
  link: "plot" | "customer",
): boolean {
  if (link === "customer") {
    return String(row.customer ?? "") === customerId;
  }
  const plotId = row.plot;
  if (plotId == null || plotId === "") return false;
  const rowCustomerId = String(row.customer ?? "") || getPlotCustomerId(plotId);
  return rowCustomerId === customerId;
}

export function isUnbilledOperationForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return (
    isUncharged(row) &&
    isBillable(row) &&
    row.plot != null &&
    row.plot !== "" &&
    !isFuelOperation(row) &&
    rowBelongsToCustomer(row, customerId, "plot")
  );
}

export function isUnbilledMaterialUsageForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return (
    isUncharged(row) &&
    isBillable(row) &&
    rowBelongsToCustomer(row, customerId, "plot")
  );
}

export function isUnbilledContractorForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return isUncharged(row) && rowBelongsToCustomer(row, customerId, "plot");
}

export function isUnbilledBaleOrderForCustomer(
  row: CollectionDocument,
  customerId: string,
): boolean {
  return isUncharged(row) && rowBelongsToCustomer(row, customerId, "customer");
}
