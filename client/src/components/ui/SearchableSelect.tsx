import Select from 'react-select'
import { getSearchableSelectStyles } from './searchableSelectStyles'

export type SelectOption = { value: string; label: string }

export type SearchableSelectProps = {
  id?: string
  value: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  isLoading?: boolean
  size?: 'default' | 'large'
  onChange: (value: string) => void
}

function matchesSearch(label: string, input: string): boolean {
  if (!input) return true
  return label.toLowerCase().includes(input.toLowerCase())
}

export function SearchableSelect({
  id,
  value,
  options,
  placeholder = 'בחר...',
  required = false,
  disabled = false,
  isLoading = false,
  size = 'default',
  onChange,
}: SearchableSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <div dir="rtl">
      <Select<SelectOption, false>
        inputId={id}
        instanceId={id}
        isSearchable
        isClearable={!required}
        isDisabled={disabled}
        isLoading={isLoading}
        placeholder={isLoading ? 'טוען...' : placeholder}
        options={options}
        value={selected}
        onChange={(option) => onChange(option?.value ?? '')}
        filterOption={(option, input) =>
          matchesSearch(option.label, input)
        }
        menuPortalTarget={
          typeof document !== 'undefined' ? document.body : undefined
        }
        menuPosition="fixed"
        styles={getSearchableSelectStyles(size)}
        noOptionsMessage={() => 'לא נמצא'}
        loadingMessage={() => 'טוען...'}
      />
    </div>
  )
}
