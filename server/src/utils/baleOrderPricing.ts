type BalePrices = {
  pricePerTon?: unknown;
  pricePerUnit?: unknown;
};

export function hasWeightValue(weight: unknown): boolean {
  if (weight == null || weight === '') return false;
  const num = Number(weight);
  return Number.isFinite(num) && num > 0;
}

export function resolveBaleOrderPrices(params: {
  pricePerTon?: unknown;
  pricePerUnit?: unknown;
  bale?: BalePrices | null;
}): { pricePerTon: number; pricePerUnit: number } {
  const pricePerTon =
    params.pricePerTon != null && params.pricePerTon !== ''
      ? Number(params.pricePerTon)
      : Number(params.bale?.pricePerTon ?? 0);
  const pricePerUnit =
    params.pricePerUnit != null && params.pricePerUnit !== ''
      ? Number(params.pricePerUnit)
      : Number(params.bale?.pricePerUnit ?? 0);
  return {
    pricePerTon: Number.isFinite(pricePerTon) ? pricePerTon : 0,
    pricePerUnit: Number.isFinite(pricePerUnit) ? pricePerUnit : 0,
  };
}

export function calcBaleOrderFinalPrice(params: {
  quantity: unknown;
  weight?: unknown;
  pricePerTon?: unknown;
  pricePerUnit?: unknown;
  bale?: BalePrices | null;
}): number {
  const quantity = Number(params.quantity ?? 0);
  if (!Number.isFinite(quantity) || quantity < 0) return 0;

  const { pricePerTon, pricePerUnit } = resolveBaleOrderPrices(params);

  if (hasWeightValue(params.weight)) {
    const weight = Number(params.weight);
    if (!Number.isFinite(pricePerTon)) return 0;
    return Number((weight * pricePerTon * quantity).toFixed(2));
  }

  if (!Number.isFinite(pricePerUnit)) return 0;
  return Number((pricePerUnit * quantity).toFixed(2));
}

export function calcBaleOrderTotalWithTransport(
  finalPrice: number,
  transportPrice: unknown,
): number | null {
  if (transportPrice == null || transportPrice === '') return null;
  const price = Number(transportPrice);
  if (!Number.isFinite(price)) return null;
  return Number((finalPrice + price).toFixed(2));
}
