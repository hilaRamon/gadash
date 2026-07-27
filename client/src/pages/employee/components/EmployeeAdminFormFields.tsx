import { operationsTrackingsAdminSchema } from "@/schema/collections/operationsTrackingsSchema"
import type { FormFieldDef } from "@/schema/types"
import { EmployeeFormField } from "./EmployeeFormField"
import { OptionalNotesField } from "./OptionalNotesField"

const formFields = operationsTrackingsAdminSchema.form.fields

export function getEmployeeAdminField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

export const employeeAdminVisibleFields: FormFieldDef[] = [
  getEmployeeAdminField("startTime"),
  getEmployeeAdminField("endTime"),
]

type EmployeeAdminFormFieldsProps = {
  values: Record<string, string>
  fieldErrors: Record<string, string>
  onChange: (key: string, value: string) => void
  showOperationField?: boolean
}

export function EmployeeAdminFormFields({
  values,
  fieldErrors,
  onChange,
  showOperationField = false,
}: EmployeeAdminFormFieldsProps) {
  return (
    <>
      {showOperationField ? (
        <EmployeeFormField
          field={{ ...getEmployeeAdminField("operation"), hidden: false }}
          value={values.operation}
          error={fieldErrors.operation}
          onChange={onChange}
        />
      ) : null}

      <EmployeeFormField
        field={getEmployeeAdminField("startTime")}
        value={values.startTime}
        error={fieldErrors.startTime}
        onChange={onChange}
      />

      <EmployeeFormField
        field={getEmployeeAdminField("endTime")}
        value={values.endTime}
        error={fieldErrors.endTime}
        onChange={onChange}
      />

      <OptionalNotesField
        field={getEmployeeAdminField("notes")}
        value={values.notes}
        onChange={onChange}
      />
    </>
  )
}
