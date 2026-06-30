import { useState } from 'react'
import { DateField } from '../../../components/collection/CollectionFormModal/DateField'
import { LogoutIcon } from '../../../components/collection/Icons'
import {
  isoToDateDisplay,
  parseDateDisplayToIso,
} from '../../../lib/dateFieldFormat'
import { useEmployee } from '../context/EmployeeContext'
import {
  EmployeeActionsRow,
  FormField,
  FormLabel,
  TextButton,
} from '../employeeStyles'

type OptionalTrackingDateProps = {
  onLogout: () => void
}

export function OptionalTrackingDate({ onLogout }: OptionalTrackingDateProps) {
  const { trackingDate, isCustomDate, setTrackingDate } = useEmployee()
  const [showPicker, setShowPicker] = useState(false)
  const [dateDisplay, setDateDisplay] = useState(() =>
    isoToDateDisplay(trackingDate),
  )

  const handleDateChange = (value: string) => {
    setTrackingDate(value)
    setShowPicker(false)
  }

  const openPicker = () => {
    setDateDisplay(isoToDateDisplay(trackingDate))
    setShowPicker(true)
  }

  return (
    <>
      {showPicker ? (
        <FormField>
          <FormLabel htmlFor="tracking-date">תאריך</FormLabel>
          <DateField
            id="tracking-date"
            value={dateDisplay}
            onChange={(display) => {
              setDateDisplay(display)
              const iso = parseDateDisplayToIso(display)
              if (iso) handleDateChange(iso)
            }}
          />
        </FormField>
      ) : null}

      <EmployeeActionsRow>
        {showPicker ? (
          <TextButton type="button" onClick={() => setShowPicker(false)}>
            ביטול
          </TextButton>
        ) : (
          <TextButton type="button" onClick={openPicker}>
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
