import { useState } from 'react'
import type { FormFieldDef } from '../../../schema/types'
import { CollapseToggle } from '../employeeStyles'
import { EmployeeFormField } from './EmployeeFormField'

type OptionalNotesFieldProps = {
  field: FormFieldDef
  value: string
  onChange: (key: string, value: string) => void
}

export function OptionalNotesField({ field, value, onChange }: OptionalNotesFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(value.trim()))

  if (!showNotes) {
    return (
      <CollapseToggle type="button" onClick={() => setShowNotes(true)}>
        הוסף הערה
      </CollapseToggle>
    )
  }

  return (
    <EmployeeFormField field={field} value={value} onChange={onChange} />
  )
}
