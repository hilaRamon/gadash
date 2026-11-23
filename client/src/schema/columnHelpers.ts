import type { ColumnDef, DocumentBase } from './types'

export function textColumn<T extends DocumentBase>(
  key: keyof T & string,
  label: string,
  overrides?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return { key, label, type: 'text', ...overrides }
}

export function notesColumn<T extends DocumentBase>(
  overrides?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return {
    key: 'notes' as keyof T & string,
    label: 'הערות',
    type: 'text',
    searchable: true,
    width: '18rem',
    inlineEditable: () => true,
    ...overrides,
  }
}
