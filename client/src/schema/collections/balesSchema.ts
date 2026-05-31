import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const balesSchema: CollectionSchema = {
  id: 'bales',
  collection: 'bales',
  label: 'חבילות (חציר)',
  columns: [
    textColumn('name', 'שם', { searchable: true, sortable: true }),
    {
      key: 'pricePerTon',
      label: 'מחיר לטון',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'pricePerUnit',
      label: 'מחיר ליחידה',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת חבילה',
    editTitle: 'עריכת חבילה',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'pricePerTon', label: 'מחיר לטון', type: 'number', required: true },
      { key: 'pricePerUnit', label: 'מחיר ליחידה', type: 'number', required: true },
    ],
  },
}
