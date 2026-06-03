import type { CollectionDocument } from '../../../schema/types'

export function applyBaleOrderFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  bales: CollectionDocument[],
): Record<string, string> {
  const next = { ...prev, [key]: value }
  if (key !== 'bale') return next

  const bale = bales.find((row) => String(row._id) === value)
  if (!bale) return next

  return {
    ...next,
    pricePerTon: String(bale.pricePerTon ?? ''),
    pricePerUnit: String(bale.pricePerUnit ?? ''),
  }
}
