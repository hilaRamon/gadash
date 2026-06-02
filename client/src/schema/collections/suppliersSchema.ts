import { textColumn } from '../columnHelpers'
import { formatMobileDisplay } from '../../lib/mobileFormat'
import type { CollectionSchema } from '../types'

export const suppliersSchema: CollectionSchema = {
  id: 'suppliers',
  collection: 'suppliers',
  label: 'ספקים',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'טלפון', {
      searchable: true,
      format: (value) => formatMobileDisplay(String(value ?? '')),
    }),
    textColumn('email', 'אימייל', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת ספק',
    editTitle: 'עריכת ספק',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'טלפון', type: 'phone' },
      { key: 'email', label: 'אימייל', type: 'text' },
    ],
  },
}
