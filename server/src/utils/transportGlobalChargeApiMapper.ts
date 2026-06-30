import type { ApiDocument } from '../types/apiDocument';
import { formatNumber } from './formatNumber';
import { toApiDocument } from './toApiDocument';

function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item != null && typeof item === 'object' && '_id' in item) {
        return String((item as { _id: unknown })._id);
      }
      return String(item ?? '');
    })
    .filter(Boolean);
}

export function transportGlobalChargeToApiDocument(
  doc: Record<string, unknown>,
): ApiDocument {
  const base = toApiDocument(doc);
  const executedAt = doc.executedAt == null ? new Date() : new Date(String(doc.executedAt));
  const transportTrackingIds = toIdArray(doc.transportTrackingIds);
  const customerBillingIds = toIdArray(doc.customerBillingIds);

  return {
    ...base,
    seasonYear: Number(doc.seasonYear ?? 0),
    executedAt: Number.isNaN(executedAt.getTime())
      ? new Date().toISOString().slice(0, 10)
      : executedAt.toISOString().slice(0, 10),
    transportTotal: Number(doc.transportTotal ?? 0),
    totalDunam: Number(doc.totalDunam ?? 0),
    pricePerDunam: Number(doc.pricePerDunam ?? 0),
    transportTrackingIds,
    customerBillingIds,
    transportRowCount: transportTrackingIds.length,
    billsCount: customerBillingIds.length,
    transportTotalFormatted: formatNumber(doc.transportTotal ?? 0),
    pricePerDunamFormatted: formatNumber(doc.pricePerDunam ?? 0),
    totalDunamFormatted: formatNumber(doc.totalDunam ?? 0),
  };
}

export function transportGlobalChargeToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(transportGlobalChargeToApiDocument);
}
