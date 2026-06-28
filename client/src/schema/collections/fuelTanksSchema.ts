import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const fuelTanksSchema: CollectionSchema = {
  id: 'fuel-tanks',
  collection: 'fuelTanks',
  label: 'מיכלי דלק',
  columns: [
    textColumn('name', 'שם', { searchable: true, sortable: true }),
    {
      key: 'currentAmount',
      label: 'כמות נוכחית',
      type: 'number',
      sortable: true,
      highlightWhenNegative: true,
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת מיכל דלק',
    editTitle: 'עריכת מיכל דלק',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'currentAmount', label: 'כמות נוכחית', type: 'number', required: true },
    ],
  },
}
