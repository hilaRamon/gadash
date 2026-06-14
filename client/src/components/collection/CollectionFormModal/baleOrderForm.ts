import type { CollectionDocument, FormFieldDef } from '../../../schema/types'
import {
  BALE_ORDER_BY_UNIT,
  BALE_ORDER_BY_WEIGHT,
  isByWeightPricing,
} from '../../../lib/baleOrderPricing'

export function getBaleOrderVisibleFields(
  fields: FormFieldDef[],
  values: Record<string, string>,
): FormFieldDef[] {
  const byWeight = isByWeightPricing(values.pricingForm ?? '')

  return fields.filter((field) => {
    if (
      field.key === 'pricePerTon' ||
      field.key === 'weight' ||
      field.key === 'weighed'
    ) {
      return byWeight
    }
    if (field.key === 'pricePerUnit') {
      return !byWeight
    }
    return true
  })
}

function applyBaleDefaults(
  next: Record<string, string>,
  bales: CollectionDocument[],
): Record<string, string> {
  const bale = bales.find((row) => String(row._id) === next.bale)
  if (!bale) return next

  return {
    ...next,
    pricePerTon: String(bale.pricePerTon ?? ''),
    pricePerUnit: String(bale.pricePerUnit ?? ''),
  }
}

export function applyBaleOrderFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  bales: CollectionDocument[],
): Record<string, string> {
  let next = { ...prev, [key]: value }

  if (key === 'bale') {
    next = applyBaleDefaults(next, bales)
  }

  if (key === 'pricingForm') {
    next = applyBaleDefaults(next, bales)
    if (value === BALE_ORDER_BY_UNIT) {
      next.weight = ''
      next.weighed = 'false'
    } else if (value === BALE_ORDER_BY_WEIGHT && !String(next.weighed ?? '').trim()) {
      next.weighed = 'false'
    }
  }

  return next
}

export function getBaleOrderRequiredErrors(
  visibleFields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const byWeight = isByWeightPricing(values.pricingForm ?? '')

  for (const field of visibleFields) {
    const val = values[field.key] ?? ''

    if (field.required && !String(val).trim()) {
      errors[field.key] = 'שדה חובה'
    }
  }

  if (!String(values.pricingForm ?? '').trim()) {
    errors.pricingForm = 'שדה חובה'
  }

  if (byWeight && !String(values.pricePerTon ?? '').trim()) {
    errors.pricePerTon = 'שדה חובה'
  }

  if (!byWeight && values.pricingForm === BALE_ORDER_BY_UNIT) {
    if (!String(values.pricePerUnit ?? '').trim()) {
      errors.pricePerUnit = 'שדה חובה'
    }
  }

  return errors
}

export function enrichBaleOrderPayload(
  payload: Record<string, unknown>,
  values: Record<string, string>,
): Record<string, unknown> {
  const byWeight = isByWeightPricing(values.pricingForm ?? '')

  if (byWeight) {
    return payload
  }

  return {
    ...payload,
    weight: null,
    weighed: false,
  }
}

export function inferBaleOrderPricingForm(row: CollectionDocument | null): string {
  if (row?.pricingForm != null && String(row.pricingForm).trim() !== '') {
    return String(row.pricingForm)
  }
  const weight = Number(row?.weight ?? 0)
  if (Number.isFinite(weight) && weight > 0) {
    return BALE_ORDER_BY_WEIGHT
  }
  return BALE_ORDER_BY_UNIT
}
