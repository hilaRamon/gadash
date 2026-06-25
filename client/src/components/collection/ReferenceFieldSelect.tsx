import { useMemo } from 'react'
import { SearchableSelect } from '../ui/SearchableSelect'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import type { CollectionDocument } from '../../schema/types'

type ReferenceFieldSelectProps = {
  collection: string
  value: string
  required?: boolean
  filterOption?: (row: CollectionDocument) => boolean
  onChange: (value: string) => void
}

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

  const selectOptions = useMemo(
    () =>
      visibleOptions.map((row) => ({
        value: String(row._id),
        label: getOptionLabel(row),
      })),
    [visibleOptions],
  )

  return (
    <SearchableSelect
      value={value}
      options={selectOptions}
      required={required}
      isLoading={isLoading}
      onChange={onChange}
    />
  )
}
