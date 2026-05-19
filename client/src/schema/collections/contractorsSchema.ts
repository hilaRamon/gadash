import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export const contractorsSchema: CollectionSchema = {
  id: 'contractors',
  collection: 'contractors',
  label: 'קבלנים ונותני שירות',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    textColumn('mobile', 'פלאפון', { searchable: true }),
    textColumn('email', 'אימייל', { searchable: true }),
    textColumn('notes', 'הערות', { searchable: true }),
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת קבלן',
    editTitle: 'עריכת קבלן',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      { key: 'mobile', label: 'פלאפון', type: 'text' },
      { key: 'email', label: 'אימייל', type: 'text' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
