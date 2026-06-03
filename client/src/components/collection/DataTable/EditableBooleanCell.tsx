import { useState } from 'react'
import type { CollectionDocument, ColumnDef } from '../../../schema/types'
import { getCellValue } from '../../../lib/tableQuery'
import { BooleanCheckboxCell } from './BooleanCheckboxCell'

type EditableBooleanCellProps = {
  column: ColumnDef
  row: CollectionDocument
  onChange: (value: unknown) => void | Promise<void>
}

export function EditableBooleanCell({
  column,
  row,
  onChange,
}: EditableBooleanCellProps) {
  const serverValue = Boolean(getCellValue(row, column))
  const [isSaving, setIsSaving] = useState(false)
  const [pendingValue, setPendingValue] = useState<boolean | null>(null)
  const checked = pendingValue ?? serverValue

  const handleChange = async (next: boolean) => {
    if (next === serverValue) return

    setPendingValue(next)
    setIsSaving(true)
    try {
      await onChange(next)
    } catch {
      setPendingValue(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BooleanCheckboxCell
      column={column}
      checked={checked}
      row={row}
      isSaving={isSaving}
      onChange={handleChange}
    />
  )
}
