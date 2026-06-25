import { useEffect, useMemo, useState } from 'react'
import {
  buildPayload,
  getInitialValues,
  getRequiredFieldErrors,
} from '../../components/collection/CollectionFormModal/helpers'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { useCreateDocument } from '../../hooks/collections/useCollectionMutations'
import { getApiErrorMessage } from '../../lib/apiErrorMessage'
import { fuelOperationsTrackingsSchema } from '../../schema/collections/fuelOperationsTrackingsSchema'
import type { FormFieldDef } from '../../schema/types'
import { EmployeeFormField } from './components/EmployeeFormField'
import { EmployeeFormShell } from './components/EmployeeFormShell'
import { OptionalNotesField } from './components/OptionalNotesField'
import { useEmployee } from './context/EmployeeContext'
import { useFormSuccessRedirect } from './hooks/useFormSuccessRedirect'
import { useRequireEmployee } from './hooks/useRequireEmployee'
import { FormStack } from './employeeStyles'

const formFields = fuelOperationsTrackingsSchema.form.fields
const hiddenKeys = new Set(['date', 'employee'])

function getField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

export function EmployeeFuelPage() {
  useRequireEmployee()
  const { employeeId, trackingDate } = useEmployee()
  const { data: operations = [] } = useCollectionList('operations')
  const createMutation = useCreateDocument('fuelOperationsTrackings')

  const fuelOperations = useMemo(
    () => operations.filter((row) => String(row.operationType ?? '') === 'דלק'),
    [operations],
  )

  const [values, setValues] = useState<Record<string, string>>(() =>
    getInitialValues(formFields, null),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useFormSuccessRedirect(success)

  useEffect(() => {
    if (employeeId) {
      setValues((prev) => ({ ...prev, employee: employeeId, date: trackingDate }))
    }
  }, [employeeId, trackingDate])

  useEffect(() => {
    if (values.operation) return
    const defaultOperation =
      fuelOperations.find((row) => String(row.name ?? '') === 'תדלוק') ??
      fuelOperations[0]
    if (defaultOperation) {
      setValues((prev) => ({
        ...prev,
        operation: String(defaultOperation._id),
      }))
    }
  }, [fuelOperations, values.operation])

  const visibleFields = useMemo(
    () =>
      formFields.filter(
        (field) =>
          !field.hidden &&
          !hiddenKeys.has(field.key) &&
          field.key !== 'notes',
      ),
    [],
  )

  const handleChange = (key: string, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    const requiredErrors = getRequiredFieldErrors(visibleFields, values)
    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors)
      return
    }

    const payloadResult = buildPayload(formFields, values)
    if (payloadResult == null) {
      setError('יש למלא את כל שדות החובה')
      return
    }
    if ('error' in payloadResult) {
      setError(String(payloadResult.error))
      return
    }

    try {
      await createMutation.mutateAsync(payloadResult)
      setSuccess(true)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    }
  }

  return (
    <EmployeeFormShell
      title="פעולת דלק"
      onSubmit={() => void handleSubmit()}
      isSubmitting={createMutation.isPending}
      error={error}
      success={success}
    >
      <FormStack onSubmit={(event) => event.preventDefault()}>
        <EmployeeFormField
          field={getField('operation')}
          value={values.operation}
          error={fieldErrors.operation}
          onChange={handleChange}
        />

        <EmployeeFormField
          field={getField('fuelTank')}
          value={values.fuelTank}
          error={fieldErrors.fuelTank}
          onChange={handleChange}
        />

        <EmployeeFormField
          field={getField('amount')}
          value={values.amount}
          error={fieldErrors.amount}
          onChange={handleChange}
        />

        <EmployeeFormField
          field={getField('tractor')}
          value={values.tractor}
          error={fieldErrors.tractor}
          onChange={handleChange}
        />

        <OptionalNotesField
          field={getField('notes')}
          value={values.notes}
          onChange={handleChange}
        />
      </FormStack>
    </EmployeeFormShell>
  )
}
