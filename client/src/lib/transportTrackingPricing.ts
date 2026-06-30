import {
  calcFinalPrice,
  calcHoursBetween,
} from "./contractorTrackingPricing";
import type { CollectionDocument } from "../schema/types";
import {
  DEFAULT_TRANSPORT_BILLING,
  TRANSPORT_BILLING_TYPES,
  type TransportBillingType,
} from "./transportBilling";

export { calcFinalPrice, calcHoursBetween };

export function calcTransportFinalPrice(
  hourlyRate: number,
  hours: number,
): number {
  return calcFinalPrice(hourlyRate, hours);
}

function toDateKey(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.slice(0, 10);
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriodStartDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function defaultTransportPeriodStartDate(): string {
  return defaultPeriodStartDateKey();
}

export function sumTransportFinalPricesInRange(
  rows: CollectionDocument[],
  fromDate: string,
  toDate: string = todayDateKey(),
): number {
  const from = toDateKey(fromDate);
  const to = toDateKey(toDate);
  if (!from) return 0;

  const sum = rows.reduce((acc, row) => {
    const dateKey = toDateKey(row.date);
    if (!dateKey || dateKey < from || dateKey > to) return acc;
    const price = Number(row.finalPrice ?? 0);
    return acc + (Number.isFinite(price) ? price : 0);
  }, 0);

  return Number(sum.toFixed(3));
}

export function sumTransportFinalPricesByBillingInRange(
  rows: CollectionDocument[],
  fromDate: string,
  toDate: string = todayDateKey(),
): Record<TransportBillingType, number> {
  const from = toDateKey(fromDate);
  const to = toDateKey(toDate);
  const sums = Object.fromEntries(
    TRANSPORT_BILLING_TYPES.map((billing) => [billing, 0]),
  ) as Record<TransportBillingType, number>;

  if (!from) return sums;

  for (const row of rows) {
    const dateKey = toDateKey(row.date);
    if (!dateKey || dateKey < from || dateKey > to) continue;

    const price = Number(row.finalPrice ?? 0);
    if (!Number.isFinite(price)) continue;

    const billing = String(row.billing ?? DEFAULT_TRANSPORT_BILLING) as TransportBillingType;
    sums[billing] = (sums[billing] ?? 0) + price;
  }

  for (const billing of TRANSPORT_BILLING_TYPES) {
    sums[billing] = Number(sums[billing].toFixed(3));
  }

  return sums;
}

export type TransportBillingTotals = {
  seasonTotal: Record<TransportBillingType, number>;
  unchargedTotal: Record<TransportBillingType, number>;
};

function emptyBillingTotals(): Record<TransportBillingType, number> {
  return Object.fromEntries(
    TRANSPORT_BILLING_TYPES.map((billing) => [billing, 0]),
  ) as Record<TransportBillingType, number>;
}

export function sumTransportBillingTotals(
  rows: CollectionDocument[],
): TransportBillingTotals {
  const seasonTotal = emptyBillingTotals();
  const unchargedTotal = emptyBillingTotals();

  for (const row of rows) {
    const price = Number(row.finalPrice ?? 0);
    if (!Number.isFinite(price)) continue;

    const billing = String(row.billing ?? DEFAULT_TRANSPORT_BILLING) as TransportBillingType;
    seasonTotal[billing] = (seasonTotal[billing] ?? 0) + price;
    if (row.wasCharged !== true) {
      unchargedTotal[billing] = (unchargedTotal[billing] ?? 0) + price;
    }
  }

  for (const billing of TRANSPORT_BILLING_TYPES) {
    seasonTotal[billing] = Number(seasonTotal[billing].toFixed(3));
    unchargedTotal[billing] = Number(unchargedTotal[billing].toFixed(3));
  }

  return { seasonTotal, unchargedTotal };
}

export function sumAllTransportFinalPrices(rows: CollectionDocument[]): number {
  const sum = rows.reduce((acc, row) => {
    const price = Number(row.finalPrice ?? 0);
    return acc + (Number.isFinite(price) ? price : 0);
  }, 0);
  return Number(sum.toFixed(3));
}

export function countUnchargedGlobalTransports(rows: CollectionDocument[]): number {
  return rows.filter(
    (row) =>
      row.wasCharged !== true &&
      String(row.billing ?? DEFAULT_TRANSPORT_BILLING) === DEFAULT_TRANSPORT_BILLING,
  ).length;
}
