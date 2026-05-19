import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const employeesSchema: CollectionSchema = {
  id: 'employees',
  collection: 'employees',
  label: 'עובדים',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('email', 'אימייל', { searchable: true }),
    textColumn('mobile', 'נייד', { searchable: true }),
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת עובד',
    editTitle: 'עריכת עובד',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'email', label: 'אימייל', type: 'text' },
      { key: 'mobile', label: 'נייד', type: 'text' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
