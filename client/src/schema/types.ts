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
}

export type FormFieldDef<T extends DocumentBase = CollectionDocument> = {
  key: keyof T & string
  label: string
  type: ColumnType | 'textarea' | 'select'
  required?: boolean
  enumOptions?: { value: string; label: string }[]
  referenceCollection?: string
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
