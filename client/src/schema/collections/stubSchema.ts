import { dataCollections } from '../../config/navigation'
import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

export function createStubSchema(
  id: string,
  collection: string,
  label: string,
): CollectionSchema {
  return {
    id,
    collection,
    label,
    columns: [
      textColumn('name', 'שם'),
      textColumn('notes', 'הערות', { searchable: true }),
    ],
    defaultSort: { field: 'name', direction: 'asc' },
    form: {
      createTitle: `הוספת ${label}`,
      editTitle: `עריכת ${label}`,
      fields: [
        { key: 'name', label: 'שם', type: 'text', required: true },
        { key: 'notes', label: 'הערות', type: 'textarea' },
      ],
    },
  }
}

const dedicatedSchemaIds = new Set([
  'employees',
  'customers',
  'contractors',
  'tractors',
  'plots',
  'seasons',
  'fuel-tanks',
])

export const stubSchemas: CollectionSchema[] = dataCollections
  .filter((item) => !dedicatedSchemaIds.has(item.id))
  .map((item) => createStubSchema(item.id, item.collection, item.label))
