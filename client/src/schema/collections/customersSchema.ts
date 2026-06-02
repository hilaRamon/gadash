import { textColumn } from '../columnHelpers'
import { formatMobileDisplay } from '../../lib/mobileFormat'
import type { CollectionSchema } from '../types'

export const customersSchema: CollectionSchema = {
  id: 'customers',
  collection: 'customers',
  label: 'לקוחות',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'נייד', {
      searchable: true,
      format: (value) => formatMobileDisplay(String(value ?? '')),
    }),
    textColumn('email', 'מייל', { searchable: true }),
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת לקוח',
    editTitle: 'עריכת לקוח',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'נייד', type: 'phone' },
      { key: 'email', label: 'מייל', type: 'text' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
