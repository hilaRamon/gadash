import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const customersSchema: CollectionSchema = {
  id: 'customers',
  collection: 'customers',
  label: 'לקוחות',
  columns: [
    {
      key: 'customerNumber',
      label: 'מס\'',
      type: 'number',
      searchable: true,
      sortable: true,
      width: '4.5rem',
    },
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'נייד', { searchable: true }),
    textColumn('email', 'מייל', { searchable: true }),
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'customerNumber', direction: 'asc' },
  form: {
    createTitle: 'הוספת לקוח',
    editTitle: 'עריכת לקוח',
    fields: [
      { key: 'customerNumber', label: 'מס\'', type: 'number', required: true },
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'נייד', type: 'text' },
      { key: 'email', label: 'מייל', type: 'text' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
