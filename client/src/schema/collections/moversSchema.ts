import { textColumn } from '../columnHelpers'
import { formatMobileDisplay } from '../../lib/mobileFormat'
import type { CollectionSchema } from '../types'

export const moversSchema: CollectionSchema = {
  id: 'movers',
  collection: 'movers',
  label: 'מובילים',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'טלפון', {
      searchable: true,
      format: (value) => formatMobileDisplay(String(value ?? '')),
    }),
    textColumn('email', 'אימייל', { searchable: true }),
    {
      key: 'hourlyRate',
      label: 'מחיר לשעה',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת מוביל',
    editTitle: 'עריכת מוביל',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'טלפון', type: 'phone' },
      { key: 'email', label: 'אימייל', type: 'text' },
      { key: 'hourlyRate', label: 'מחיר לשעה', type: 'number' },
    ],
  },
}
