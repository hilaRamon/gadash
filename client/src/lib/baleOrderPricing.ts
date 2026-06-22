export const BALE_ORDER_PRICING_FORMS = ['לפי משקל', 'לפי יחידות'] as const;
export type BaleOrderPricingForm = (typeof BALE_ORDER_PRICING_FORMS)[number];

export const BALE_ORDER_BY_WEIGHT = BALE_ORDER_PRICING_FORMS[0];
export const BALE_ORDER_BY_UNIT = BALE_ORDER_PRICING_FORMS[1];

type BalePrices = {
  pricePerTon?: unknown;
  pricePerUnit?: unknown;
};

export function isByWeightPricing(pricingForm: unknown): boolean {
  return String(pricingForm ?? '') === BALE_ORDER_BY_WEIGHT;
}

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
  pricingForm?: unknown;
  bale?: BalePrices | null;
  transportPrice?: unknown;
}): number {
  const { pricePerTon, pricePerUnit } = resolveBaleOrderPrices(params);
  const pricingForm = String(params.pricingForm ?? '');

  let base = 0;
  if (isByWeightPricing(pricingForm)) {
    const weight = Number(params.weight ?? 0);
    if (Number.isFinite(weight) && weight > 0 && Number.isFinite(pricePerTon)) {
      base = Number((weight * pricePerTon).toFixed(2));
    }
  } else if (pricingForm === BALE_ORDER_BY_UNIT) {
    const quantity = Number(params.quantity ?? 0);
    if (Number.isFinite(quantity) && quantity >= 0 && Number.isFinite(pricePerUnit)) {
      base = Number((quantity * pricePerUnit).toFixed(2));
    }
  }

  if (params.transportPrice == null || params.transportPrice === '') return base;
  const transport = Number(params.transportPrice);
  if (!Number.isFinite(transport)) return base;
  return Number((base + transport).toFixed(2));
}
