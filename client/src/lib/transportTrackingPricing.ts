import {
  calcFinalPrice,
  calcHoursBetween,
} from "./contractorTrackingPricing";
import type { CollectionDocument } from "../schema/types";

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
