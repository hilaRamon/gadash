import styled from 'styled-components'
import { fieldControlStyles } from './sharedStyles'

type HourFieldProps = {
  id: string
  value: string
  required?: boolean
  onChange: (value: string) => void
}

const Input = styled.input`
  ${fieldControlStyles}
`

function formatHourInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function HourField({ id, value, required, onChange }: HourFieldProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="--:--"
      value={value}
      onChange={(e) => onChange(formatHourInput(e.target.value))}
      required={required}
    />
  )
}
