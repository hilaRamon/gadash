import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

const billingUnitOptions = [{ value: 'קג/ליטר', label: 'קג/ליטר' }]

export const materialsSchema: CollectionSchema = {
  id: 'materials',
  collection: 'materials',
  label: 'חומרים',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    {
      key: 'billingUnit',
      label: 'שיטת חיוב',
      type: 'enum',
      enumOptions: billingUnitOptions,
      filterable: true,
      width: '6.5rem',
    },
    {
      key: 'currentBuyingCost',
      label: 'מחיר קניה',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'currentSalePercent',
      label: 'אחוז מכירה',
      type: 'number',
      sortable: true,
      width: '6rem',
      format: (value) => `${Number(value ?? 0)}%`,
    },
    {
      key: 'customerCost',
      label: 'מחיר ללקוח',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'currentQuantity',
      label: 'כמות נוכחית',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת חומר',
    editTitle: 'עריכת חומר',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      {
        key: 'billingUnit',
        label: 'שיטת חיוב',
        type: 'enum',
        required: true,
        enumOptions: billingUnitOptions,
      },
      { key: 'currentQuantity', label: 'כמות נוכחית', type: 'number', required: true },
      { key: 'currentBuyingCost', label: 'מחיר קניה', type: 'number', required: true },
      { key: 'currentSalePercent', label: 'אחוז מכירה', type: 'number' },
    ],
  },
}
