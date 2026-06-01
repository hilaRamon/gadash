import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const customersSchema: CollectionSchema = {
  id: 'customers',
  collection: 'customers',
  label: 'לקוחות',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'נייד', { searchable: true }),
    textColumn('email', 'מייל', { searchable: true }),
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת לקוח',
    editTitle: 'עריכת לקוח',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'נייד', type: 'text' },
      { key: 'email', label: 'מייל', type: 'text' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
