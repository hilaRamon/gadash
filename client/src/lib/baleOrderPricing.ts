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
  transportPrice?: unknown;
}): number {
  const quantity = Number(params.quantity ?? 0);
  if (!Number.isFinite(quantity) || quantity < 0) return 0;

  const { pricePerTon, pricePerUnit } = resolveBaleOrderPrices(params);

  let base = 0;
  if (hasWeightValue(params.weight)) {
    const weight = Number(params.weight);
    if (Number.isFinite(pricePerTon)) {
      base = Number((weight * pricePerTon * quantity).toFixed(2));
    }
  } else if (Number.isFinite(pricePerUnit)) {
    base = Number((pricePerUnit * quantity).toFixed(2));
  }

  if (params.transportPrice == null || params.transportPrice === '') return base;
  const transport = Number(params.transportPrice);
  if (!Number.isFinite(transport)) return base;
  return Number((base + transport).toFixed(2));
}
