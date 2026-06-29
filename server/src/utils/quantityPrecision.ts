export const QUANTITY_DECIMALS = 4;

export function roundQuantity(value: number): number {
  return Number(value.toFixed(QUANTITY_DECIMALS));
}
