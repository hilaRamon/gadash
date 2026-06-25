import type { ReactNode } from 'react'
import { FormFieldControl } from '../../../components/collection/CollectionFormModal/FormFieldControl'
import type { FormFieldDef } from '../../../schema/types'
import { FieldError, FormField, FormLabel } from '../employeeStyles'

type EmployeeFormFieldProps = {
  field: FormFieldDef
  value: string
  error?: string
  onChange: (key: string, value: string) => void
  children?: ReactNode
}

export function EmployeeFormField({
  field,
  value,
  error,
  onChange,
  children,
}: EmployeeFormFieldProps) {
  return (
    <FormField>
      <FormLabel htmlFor={`field-${field.key}`}>{field.label}</FormLabel>
      {children ?? (
        <FormFieldControl field={field} value={value} setFieldValue={onChange} />
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </FormField>
  )
}
