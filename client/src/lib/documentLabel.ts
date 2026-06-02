import type { CollectionDocument, CollectionSchema } from '../schema/types'

/**
 * Derives a human-readable label for a document using its schema's first
 * column (honoring getValue/format). Falls back to the document id when the
 * primary column has no displayable value.
 */
export function getDocumentLabel(
  schema: CollectionSchema,
  row: CollectionDocument,
): string {
  const column = schema.columns[0]
  if (!column) return row._id

  const raw = column.getValue ? column.getValue(row) : row[column.key]
  const text = column.format ? column.format(raw, row) : raw

  if (text == null || text === '') return row._id
  return String(text)
}
