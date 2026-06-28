import { MaterialModel } from '../models/Material';
import type { MaterialPricingEntryInput } from '../repositories/materialRepository';

type MaterialQuantityRow = {
  inventoryGroup?: unknown;
  currentQuantity?: unknown;
};

type MaterialPricingRow = {
  _id?: unknown;
  inventoryGroup?: unknown;
  currentBuyingCost?: unknown;
  currentSalePercent?: unknown;
  pricingHistory?: MaterialPricingEntryInput[];
};

function normalizePricingEntry(
  entry: MaterialPricingEntryInput,
): MaterialPricingEntryInput {
  return {
    cost: entry.cost,
    percent: entry.percent,
    effectiveFrom: new Date(entry.effectiveFrom),
  };
}

export async function syncInventoryGroupPricingFromMaterial(
  source: MaterialPricingRow,
  latestEntry?: MaterialPricingEntryInput,
): Promise<void> {
  const group = String(source.inventoryGroup ?? '').trim();
  if (!group || source._id == null) return;

  const history = source.pricingHistory ?? [];
  const entry = latestEntry ?? history[history.length - 1];
  if (!entry) return;

  const normalizedEntry = normalizePricingEntry(entry);
  const currentBuyingCost = Number(source.currentBuyingCost ?? 0);
  const currentSalePercent = Number(source.currentSalePercent ?? 15);

  const siblings = await MaterialModel.find({
    inventoryGroup: group,
    _id: { $ne: source._id },
  })
    .select('_id pricingHistory')
    .lean();

  for (const sibling of siblings) {
    const siblingHistory = (sibling.pricingHistory ??
      []) as MaterialPricingEntryInput[];
    const duplicateDate = siblingHistory.some(
      (historyEntry) =>
        new Date(historyEntry.effectiveFrom).getTime() ===
        normalizedEntry.effectiveFrom.getTime(),
    );

    const update: {
      $set: { currentBuyingCost: number; currentSalePercent: number };
      $push?: { pricingHistory: MaterialPricingEntryInput };
    } = {
      $set: {
        currentBuyingCost,
        currentSalePercent,
      },
    };

    if (!duplicateDate) {
      update.$push = { pricingHistory: normalizedEntry };
    }

    await MaterialModel.findByIdAndUpdate(sibling._id, update, {
      runValidators: true,
    });
  }
}

export function buildGroupQuantityMap(
  materials: MaterialQuantityRow[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const material of materials) {
    const group = String(material.inventoryGroup ?? "").trim();
    if (!group) continue;

    const quantity = Number(material.currentQuantity ?? 0);
    if (!Number.isFinite(quantity)) continue;

    const next = (totals.get(group) ?? 0) + quantity;
    totals.set(group, Number(next.toFixed(3)));
  }

  return totals;
}

export function getDisplayQuantity(
  row: MaterialQuantityRow,
  groupQuantityMap: Map<string, number>,
): number {
  const group = String(row.inventoryGroup ?? "").trim();
  if (group) {
    return groupQuantityMap.get(group) ?? Number(row.currentQuantity ?? 0);
  }
  return Number(row.currentQuantity ?? 0);
}

export function enrichMaterialsWithGroupQuantity<
  T extends MaterialQuantityRow & Record<string, unknown>,
>(materials: T[]): Array<T & { groupQuantity: number }> {
  const groupQuantityMap = buildGroupQuantityMap(materials);
  return materials.map((row) => ({
    ...row,
    groupQuantity: getDisplayQuantity(row, groupQuantityMap),
  }));
}
