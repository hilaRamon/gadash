import { textColumn } from '../columnHelpers'
import { formatMobileDisplay } from "@/lib/mobileFormat"
import { formatNumber } from "@/lib/formatNumber"
import type { CollectionSchema } from '../types'

export const employeesSchema: CollectionSchema = {
  id: 'employees',
  collection: 'employees',
  label: 'עובדים',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('email', 'אימייל', { searchable: true }),
    textColumn('mobile', 'נייד', {
      searchable: true,
      format: (value) => formatMobileDisplay(String(value ?? '')),
    }),
    {
      key: 'hourlyCost',
      label: 'עלות לשעה',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '7rem',
    },
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת עובד',
    editTitle: 'עריכת עובד',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'email', label: 'אימייל', type: 'text' },
      { key: 'mobile', label: 'נייד', type: 'phone' },
      { key: 'hourlyCost', label: 'עלות לשעה', type: 'number', defaultValue: 0 },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
