import { materialsSeedData } from './materialsSeed'
import { suppliersSeedData } from './suppliersSeed'
import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const seedRows = [
  {
    date: '2026-05-30',
    materialIndex: 0,
    supplierIndex: 0,
    unitPrice: 12.4,
    amount: 140,
    notes: 'משלוח ראשון',
  },
  { date: '2026-05-29', materialIndex: 1, supplierIndex: 1, unitPrice: 37, amount: 45, notes: '' },
  {
    date: '2026-05-28',
    materialIndex: 2,
    supplierIndex: 2,
    unitPrice: 39,
    amount: 64.5,
    notes: 'תשלום בהעברה בנקאית',
  },
]

export const materialPurchaseTrackingsSeedData: CollectionDocument[] = seedRows.map(
  (row, index) => {
    const material = materialsSeedData[row.materialIndex]
    const supplier = suppliersSeedData[row.supplierIndex]
    const finalPrice = Number((row.unitPrice * row.amount).toFixed(2))
    return {
      _id: mockObjectId(`material-purchase-tracking-${index + 1}`),
      date: row.date,
      material: material?._id ?? '',
      materialName: String(material?.name ?? ''),
      supplier: supplier?._id ?? '',
      supplierName: String(supplier?.name ?? ''),
      unitPrice: row.unitPrice,
      amount: row.amount,
      finalPrice,
      notes: row.notes,
    }
  },
)
