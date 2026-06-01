import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

const plotTypeOptions = [
  { value: 'הר', label: 'הר' },
  { value: 'בקעה', label: 'בקעה' },
]

export const plotsSchema: CollectionSchema = {
  id: 'plots',
  collection: 'plots',
  label: 'חלקות',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    {
      key: 'customer',
      label: 'לקוח',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.customerName ?? row.customer,
    },
    {
      key: 'dunam',
      label: 'דונם',
      type: 'number',
      sortable: true,
      width: '5rem',
    },
    {
      key: 'plotType',
      label: 'סוג',
      type: 'enum',
      enumOptions: plotTypeOptions,
      format: (value) => (value == null || value === '' ? '' : String(value)),
    },
    {
      key: 'active',
      label: 'פעיל',
      type: 'boolean',
      sortable: true,
      width: '4.5rem',
      format: (value) => (value ? 'פעיל' : 'לא פעיל'),
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת חלקה',
    editTitle: 'עריכת חלקה',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      {
        key: 'customer',
        label: 'לקוח',
        type: 'reference',
        required: true,
        referenceCollection: 'customers',
      },
      { key: 'dunam', label: 'דונם', type: 'number', required: true },
      {
        key: 'plotType',
        label: 'סוג',
        type: 'enum',
        enumOptions: plotTypeOptions,
      },
      { key: 'active', label: 'פעיל', type: 'boolean' },
    ],
  },
}
