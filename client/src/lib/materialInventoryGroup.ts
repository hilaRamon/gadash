import type { CollectionDocument } from "../schema/types";
import { roundQuantity } from "./quantityPrecision";

export function buildGroupQuantityMap(
  materials: CollectionDocument[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const material of materials) {
    const group = String(material.inventoryGroup ?? "").trim();
    if (!group) continue;

    const quantity = Number(material.currentQuantity ?? 0);
    if (!Number.isFinite(quantity)) continue;

    const next = (totals.get(group) ?? 0) + quantity;
    totals.set(group, roundQuantity(next));
  }

  return totals;
}

export function getDisplayQuantity(
  row: CollectionDocument,
  groupQuantityMap: Map<string, number>,
): number {
  const group = String(row.inventoryGroup ?? "").trim();
  if (group) {
    return groupQuantityMap.get(group) ?? Number(row.currentQuantity ?? 0);
  }
  return Number(row.currentQuantity ?? 0);
}

export function enrichMaterialsWithGroupQuantity(
  materials: CollectionDocument[],
): CollectionDocument[] {
  const groupQuantityMap = buildGroupQuantityMap(materials);
  return materials.map((row) => ({
    ...row,
    groupQuantity: getDisplayQuantity(row, groupQuantityMap),
  }));
}
