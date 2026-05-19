import { useCollectionList } from '../../hooks/collections/useCollectionList'
import type { CollectionDocument } from '../../schema/types'

type ReferenceFieldSelectProps = {
  collection: string
  value: string
  required?: boolean
  onChange: (value: string) => void
}

function getOptionLabel(row: CollectionDocument): string {
  if (typeof row.name === 'string' && row.name) return row.name
  if (typeof row.customerNumber === 'number') return String(row.customerNumber)
  return String(row._id)
}

export function ReferenceFieldSelect({
  collection,
  value,
  required,
  onChange,
}: ReferenceFieldSelectProps) {
  const { data: options = [], isLoading } = useCollectionList(collection)

  return (
    <select
      className="form-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{isLoading ? 'טוען...' : 'בחר...'}</option>
      {options.map((row) => (
        <option key={row._id} value={row._id}>
          {getOptionLabel(row)}
        </option>
      ))}
    </select>
  )
}
