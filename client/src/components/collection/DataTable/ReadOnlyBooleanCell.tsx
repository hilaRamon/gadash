import type { CollectionDocument, ColumnDef } from '../../../schema/types'
import { BooleanCheckboxCell } from './BooleanCheckboxCell'

type ReadOnlyBooleanCellProps = {
  column: ColumnDef
  checked: boolean
  row: CollectionDocument
}

export function ReadOnlyBooleanCell({
  column,
  checked,
  row,
}: ReadOnlyBooleanCellProps) {
  return <BooleanCheckboxCell column={column} checked={checked} row={row} />
}
