import { useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  formatMobileDisplay,
  MOBILE_INVALID_ERROR,
  normalizeMobile,
} from '../../lib/mobileFormat'

type PhoneFieldProps = {
  id: string
  value: string
  required?: boolean
  onChange: (displayValue: string) => void
}

const Input = styled.input`
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

const Error = styled.p`
  margin: 0 0 1rem;
  color: var(--color-error-text);
  font-size: 0.875rem;
`

export function PhoneField({ id, value, required, onChange }: PhoneFieldProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [value])

  const handleBlur = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError(null)
      return
    }

    try {
      const e164 = normalizeMobile(trimmed)
      onChange(formatMobileDisplay(e164))
      setError(null)
    } catch {
      setError(MOBILE_INVALID_ERROR)
    }
  }

  return (
    <>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (error) setError(null)
        }}
        onBlur={handleBlur}
        required={required}
      />
      {error && <Error>{error}</Error>}
    </>
  )
}
