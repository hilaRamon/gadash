import { useState } from 'react'
import styled from 'styled-components'
import { useEmployee } from "@/pages/employee/context/EmployeeContext"
import {
  EmployeeActionsRow,
  EmployeeSubtitle,
  FormField,
  FormLabel,
  TextButton,
} from '../employeeStyles'

const PickerInput = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export function OptionalTrackingDate() {
  const { trackingDate, isCustomDate, setTrackingDate } = useEmployee()
  const [showPicker, setShowPicker] = useState(false)

  const dateLabel = isCustomDate
    ? `תאריך: ${new Date(`${trackingDate}T00:00:00`).toLocaleDateString('he-IL')}`
    : 'תאריך: היום'

  return (
    <>
      <EmployeeSubtitle>{dateLabel}</EmployeeSubtitle>

      {showPicker ? (
        <FormField>
          <FormLabel htmlFor="tracking-date">תאריך</FormLabel>
          <PickerInput
            id="tracking-date"
            type="date"
            value={trackingDate}
            onChange={(event) => {
              const iso = event.target.value
              if (iso) setTrackingDate(iso)
            }}
            onBlur={() => setShowPicker(false)}
          />
        </FormField>
      ) : null}

      <EmployeeActionsRow>
        {showPicker ? (
          <TextButton type="button" onClick={() => setShowPicker(false)}>
            ביטול
          </TextButton>
        ) : (
          <TextButton type="button" onClick={() => setShowPicker(true)}>
            {isCustomDate ? 'שנה תאריך' : 'דווח לתאריך אחר'}
          </TextButton>
        )}
      </EmployeeActionsRow>
    </>
  )
}
