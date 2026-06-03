import styled from 'styled-components'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import type { CollectionDocument } from '../../schema/types'

type ReferenceFieldSelectProps = {
  collection: string
  value: string
  required?: boolean
  filterOption?: (row: CollectionDocument) => boolean
  onChange: (value: string) => void
}

const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

function getOptionLabel(row: CollectionDocument): string {
  if (typeof row.name === 'string' && row.name) return row.name
  return String(row._id)
}

export function ReferenceFieldSelect({
  collection,
  value,
  required,
  filterOption,
  onChange,
}: ReferenceFieldSelectProps) {
  const { data: options = [], isLoading } = useCollectionList(collection)
  const visibleOptions = filterOption ? options.filter(filterOption) : options

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{isLoading ? 'טוען...' : 'בחר...'}</option>
      {visibleOptions.map((row) => (
        <option key={row._id} value={row._id}>
          {getOptionLabel(row)}
        </option>
      ))}
    </Select>
  )
}
