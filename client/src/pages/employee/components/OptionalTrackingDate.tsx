import { useState } from 'react'
import { useEmployee } from '../context/EmployeeContext'
import {
  EmployeeActionsRow,
  FormField,
  FormInput,
  FormLabel,
  TextButton,
} from '../employeeStyles'

type OptionalTrackingDateProps = {
  onClearEmployee: () => void
}

export function OptionalTrackingDate({ onClearEmployee }: OptionalTrackingDateProps) {
  const { trackingDate, isCustomDate, setTrackingDate } = useEmployee()
  const [showPicker, setShowPicker] = useState(false)

  const handleDateChange = (value: string) => {
    setTrackingDate(value)
    setShowPicker(false)
  }

  return (
    <>
      {showPicker ? (
        <FormField>
          <FormLabel htmlFor="tracking-date">תאריך</FormLabel>
          <FormInput
            id="tracking-date"
            type="date"
            value={trackingDate}
            onChange={(event) => handleDateChange(event.target.value)}
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
        <TextButton type="button" onClick={onClearEmployee}>
          החלף עובד
        </TextButton>
      </EmployeeActionsRow>
    </>
  )
}
