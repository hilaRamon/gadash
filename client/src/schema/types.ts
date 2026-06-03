import type { ReactNode } from 'react'

export type DocumentBase = {
  _id: string
}

export type CollectionDocument = DocumentBase & Record<string, unknown>

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'reference'

export type ColumnDef<T extends DocumentBase = CollectionDocument> = {
  key: keyof T & string
  label: string
  type: ColumnType
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'start' | 'end' | 'center'
  getValue?: (row: T) => unknown
  format?: (value: unknown, row: T) => string
  render?: (value: unknown, row: T) => ReactNode
  enumOptions?: { value: string; label: string }[]
  /** When true, enum cells/filters may use null (shown as —). Defaults from matching optional form field. */
  nullable?: boolean
  /** When false, boolean cells are read-only. Defaults to editable. */
  inlineEditable?: (row: T) => boolean
}

export type FormFieldDef<T extends DocumentBase = CollectionDocument> = {
  key: keyof T & string
  label: string
  type: ColumnType | 'textarea' | 'select' | 'phone' | 'time'
  required?: boolean
  enumOptions?: { value: string; label: string }[]
  referenceCollection?: string
  referenceFilter?: (row: CollectionDocument) => boolean
  /** When true, field is omitted from the form UI (still included in submit payload). */
  hidden?: boolean
  /** Applied for hidden fields (and forced on submit when hidden). */
  defaultValue?: string | boolean | null
}

export type FormSchema<T extends DocumentBase = CollectionDocument> = {
  fields: FormFieldDef<T>[]
  createTitle?: string
  editTitle?: string
}

export type CollectionSchema<T extends DocumentBase = CollectionDocument> = {
  id: string
  collection: string
  label: string
  columns: ColumnDef<T>[]
  defaultSort?: { field: keyof T & string; direction: 'asc' | 'desc' }
  form: FormSchema<T>
}
