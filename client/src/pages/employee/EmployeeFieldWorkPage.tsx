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
import { OPERATION_PRICING_BY_UNIT } from '../../lib/operationTrackingPricing'
import { operationsTrackingsFieldWorkSchema } from '../../schema/collections/operationsTrackingsSchema'
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
import { FormField, FormLabel, FormStack, ReadOnlyValue, FieldError } from './employeeStyles'

const formFields = operationsTrackingsFieldWorkSchema.form.fields
const hiddenKeys = new Set(['date', 'employee', 'billable', 'wasCharged'])

function getField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

export function EmployeeFieldWorkPage() {
  useRequireEmployee()
  const { employeeId, trackingDate } = useEmployee()
  const { data: operations = [] } = useCollectionList('operations')
  const { data: plots = [] } = useCollectionList('plots')
  const createMutation = useCreateDocument('operationsTrackings')

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

  const selectedOperation = useMemo(
    () =>
      operations.find((row) => String(row._id) === values.operation) ?? null,
    [operations, values.operation],
  )

  const isUnitPricing =
    String(selectedOperation?.pricingForm ?? '') === OPERATION_PRICING_BY_UNIT

  const visibleFields = useMemo(
    () => formFields.filter((field) => !field.hidden && !hiddenKeys.has(field.key)),
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

  return (
    <EmployeeFormShell
      title="משימת עיבוד"
      onSubmit={() => void handleSubmit()}
      isSubmitting={createMutation.isPending}
      error={error}
      success={success}
    >
      <FormStack onSubmit={(event) => event.preventDefault()}>
        <EmployeeFormField
          field={getField('plot')}
          value={values.plot}
          error={fieldErrors.plot}
          onChange={handleChange}
        />

        <EmployeeFormField
          field={getField('operation')}
          value={values.operation}
          error={fieldErrors.operation}
          onChange={handleChange}
        />

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

        {values.operation ? (
          isUnitPricing ? (
            <EmployeeFormField
              field={getField('amount')}
              value={values.amount}
              error={fieldErrors.amount}
              onChange={handleChange}
            />
          ) : (
            <FormField>
              <FormLabel>{getField('amount').label}</FormLabel>
              <ReadOnlyValue>
                {values.amount ? values.amount : 'תחושב אוטומטית'}
              </ReadOnlyValue>
              {fieldErrors.amount ? (
                <FieldError>{fieldErrors.amount}</FieldError>
              ) : null}
            </FormField>
          )
        ) : null}

        <OptionalNotesField
          field={getField('notes')}
          value={values.notes}
          onChange={handleChange}
        />
      </FormStack>
    </EmployeeFormShell>
  )
}
