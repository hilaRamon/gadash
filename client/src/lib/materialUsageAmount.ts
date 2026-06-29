import { roundQuantity } from './quantityPrecision';

export function calcMaterialUsageAmount(
  plotDunam: number,
  amountPerDunam: number | null | undefined,
): number | null {
  if (amountPerDunam == null || !Number.isFinite(amountPerDunam)) {
    return null;
  }
  if (!Number.isFinite(plotDunam) || plotDunam < 0) {
    return null;
  }
  return roundQuantity(plotDunam * amountPerDunam);
}
