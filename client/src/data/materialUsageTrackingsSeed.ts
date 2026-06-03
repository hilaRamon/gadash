import { employeesSeedData } from './employeesSeed'
import { materialsSeedData } from './materialsSeed'
import { plotsSeedData } from './plotsSeed'
import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const seedRows = [
  {
    date: '2026-05-30',
    materialIndex: 0,
    plotIndex: 0,
    employeeIndex: 0,
    amount: 12.5,
    billable: true,
    notes: 'ריסוס בוקר',
  },
  {
    date: '2026-05-29',
    materialIndex: 1,
    plotIndex: 1,
    employeeIndex: 1,
    amount: 8,
    billable: true,
    notes: '',
  },
  {
    date: '2026-05-28',
    materialIndex: 2,
    plotIndex: 2,
    employeeIndex: 2,
    amount: 15,
    billable: false,
    notes: 'בדיקת שטח פנימית',
  },
]

export const materialUsageTrackingsSeedData: CollectionDocument[] = seedRows.map((row, index) => {
  const material = materialsSeedData[row.materialIndex]
  const plot = plotsSeedData[row.plotIndex]
  const employee = employeesSeedData[row.employeeIndex]
  const unitSalePrice = Number(material?.customerCost ?? 0)
  const finalPrice = Number((unitSalePrice * row.amount).toFixed(2))

  return {
    _id: mockObjectId(`material-usage-tracking-${index + 1}`),
    date: row.date,
    material: material?._id ?? '',
    materialName: String(material?.name ?? ''),
    customer: plot?.customer ?? '',
    customerName: String(plot?.customerName ?? ''),
    plot: plot?._id ?? '',
    plotName: String(plot?.name ?? ''),
    employee: employee?._id ?? '',
    employeeName: String(employee?.name ?? ''),
    amount: row.amount,
    finalPrice,
    billable: row.billable,
    notes: row.notes,
  }
})
