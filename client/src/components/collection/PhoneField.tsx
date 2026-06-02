import { useEffect, useState } from 'react'
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
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        className="form-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (error) setError(null)
        }}
        onBlur={handleBlur}
        required={required}
      />
      {error && <p className="form-error">{error}</p>}
    </>
  )
}
