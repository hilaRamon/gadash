import { useState } from 'react'
import { LogoutIcon } from '../../../components/collection/Icons'
import { useEmployee } from '../context/EmployeeContext'
import {
  EmployeeActionsRow,
  FormField,
  FormInput,
  FormLabel,
  TextButton,
} from '../employeeStyles'

type OptionalTrackingDateProps = {
  onLogout: () => void
}

export function OptionalTrackingDate({ onLogout }: OptionalTrackingDateProps) {
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
        <TextButton type="button" onClick={onLogout}>
          <LogoutIcon size={18} />
          התנתק
        </TextButton>
      </EmployeeActionsRow>
    </>
  )
}
