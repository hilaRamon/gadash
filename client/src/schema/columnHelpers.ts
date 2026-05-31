import type { ColumnDef, DocumentBase } from './types'

export function textColumn<T extends DocumentBase>(
  key: keyof T & string,
  label: string,
  overrides?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return { key, label, type: 'text', ...overrides }
}
