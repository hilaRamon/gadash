import { useEffect, useMemo, useState } from 'react'
import {
  applyOperationTrackingFieldChange,
  enrichOperationTrackingPayload,
  getOperationTrackingRequiredErrors,
} from '../../components/collection/CollectionFormModal/operationTrackingForm'
import {
  buildPayload,
  getInitialValues,
} from '../../components/collection/CollectionFormModal/helpers'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { useCreateDocument } from '../../hooks/collections/useCollectionMutations'
import { getApiErrorMessage } from '../../lib/apiErrorMessage'
import { operationsTrackingsAdminSchema } from '../../schema/collections/operationsTrackingsSchema'
import type { FormFieldDef } from '../../schema/types'
import { EmployeeFormField } from './components/EmployeeFormField'
import { EmployeeFormShell } from './components/EmployeeFormShell'
import { OptionalNotesField } from './components/OptionalNotesField'
import { useEmployee } from './context/EmployeeContext'
import { useFormSuccessRedirect } from './hooks/useFormSuccessRedirect'
import { useRequireEmployee } from './hooks/useRequireEmployee'
import {
  assertEndAfterStart,
} from './lib/formDefaults'
import { FormStack } from './employeeStyles'

const formFields = operationsTrackingsAdminSchema.form.fields

function getField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

export function EmployeeAdminPage() {
  useRequireEmployee()
  const { employeeId, trackingDate } = useEmployee()
  const { data: operations = [] } = useCollectionList('operations')
  const { data: plots = [] } = useCollectionList('plots')
  const createMutation = useCreateDocument('operationsTrackings')

  const adminOperations = useMemo(
    () => operations.filter((row) => String(row.operationType ?? '') === 'מנהלה'),
    [operations],
  )

  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...getInitialValues(formFields, null),
    billable: 'false',
    plot: '',
  }))
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
    if (adminOperations.length === 1 && !values.operation) {
      setValues((prev) => ({
        ...prev,
        operation: String(adminOperations[0]._id),
      }))
    }
  }, [adminOperations, values.operation])

  const visibleFields = useMemo(
    () => [
      getField('startTime'),
      getField('endTime'),
    ],
    [],
  )

  const handleChange = (key: string, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setValues((prev) => {
      const { next } = applyOperationTrackingFieldChange(key, value, prev, {
        operations,
        plots,
        editingRow: null,
      })
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    const timeError = assertEndAfterStart(values.startTime, values.endTime)
    const requiredErrors = getOperationTrackingRequiredErrors(
      visibleFields,
      values,
      operations,
    )
    const errors = { ...requiredErrors }
    if (!values.operation.trim()) errors.operation = 'שדה חובה'
    if (timeError) errors.endTime = timeError

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
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

    const enriched = enrichOperationTrackingPayload(
      payloadResult,
      values,
      operations,
      plots,
    )

    try {
      await createMutation.mutateAsync(enriched)
      setSuccess(true)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    }
  }

  const operationField = getField('operation')

  return (
    <EmployeeFormShell
      title="משימת מנהלה"
      onSubmit={() => void handleSubmit()}
      isSubmitting={createMutation.isPending}
      error={error}
      success={success}
    >
      <FormStack onSubmit={(event) => event.preventDefault()}>
        {adminOperations.length > 1 ? (
          <EmployeeFormField
            field={{ ...operationField, hidden: false }}
            value={values.operation}
            error={fieldErrors.operation}
            onChange={handleChange}
          />
        ) : null}

        <EmployeeFormField
          field={getField('startTime')}
          value={values.startTime}
          error={fieldErrors.startTime}
          onChange={handleChange}
        />

        <EmployeeFormField
          field={getField('endTime')}
          value={values.endTime}
          error={fieldErrors.endTime}
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
