import { useEffect, useMemo, useState } from 'react'
import {
  applyMaterialUsageFieldChange,
  enrichMaterialUsagePayload,
} from '../../components/collection/CollectionFormModal/materialUsageTrackingForm'
import {
  buildPayload,
  getInitialValues,
  getRequiredFieldErrors,
} from '../../components/collection/CollectionFormModal/helpers'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { useCreateDocument } from '../../hooks/collections/useCollectionMutations'
import { getApiErrorMessage } from '../../lib/apiErrorMessage'
import { materialUsageTrackingsSchema } from '../../schema/collections/materialUsageTrackingsSchema'
import type { FormFieldDef } from '../../schema/types'
import { EmployeeFormField } from './components/EmployeeFormField'
import { EmployeeFormShell } from './components/EmployeeFormShell'
import { OptionalNotesField } from './components/OptionalNotesField'
import { useEmployee } from './context/EmployeeContext'
import { useFormSuccessRedirect } from './hooks/useFormSuccessRedirect'
import { useRequireEmployee } from './hooks/useRequireEmployee'
import { FormField, FormLabel, FormStack, ReadOnlyValue, FieldError } from './employeeStyles'

const formFields = materialUsageTrackingsSchema.form.fields
const hiddenKeys = new Set(['date', 'employee', 'billable', 'wasCharged'])

function getField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

export function EmployeeMaterialPage() {
  useRequireEmployee()
  const { employeeId, trackingDate } = useEmployee()
  const { data: materials = [] } = useCollectionList('materials')
  const { data: plots = [] } = useCollectionList('plots')
  const createMutation = useCreateDocument('materialUsageTrackings')

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

  const amountAutoCalculated = useMemo(() => {
    if (!values.plot || !values.material) return false
    const plot = plots.find((row) => String(row._id) === values.plot)
    const material = materials.find((row) => String(row._id) === values.material)
    if (!plot || !material) return false
    return material.amountPerDunam != null && Number.isFinite(Number(material.amountPerDunam))
  }, [values.plot, values.material, plots, materials])

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
      const { next } = applyMaterialUsageFieldChange(key, value, prev, {
        materials,
        plots,
        editingRow: null,
      })
      return next
    })
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

    const enriched = enrichMaterialUsagePayload(payloadResult, values, {
      materials,
      plots,
      editingRow: null,
    })

    try {
      await createMutation.mutateAsync(enriched)
      setSuccess(true)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    }
  }

  return (
    <EmployeeFormShell
      title="שימוש בחומר"
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
          field={getField('material')}
          value={values.material}
          error={fieldErrors.material}
          onChange={handleChange}
        />

        {amountAutoCalculated ? (
          <FormField>
            <FormLabel>{getField('amount').label}</FormLabel>
            <ReadOnlyValue>
              {values.amount ? values.amount : 'תחושב אוטומטית'}
            </ReadOnlyValue>
            {fieldErrors.amount ? (
              <FieldError>{fieldErrors.amount}</FieldError>
            ) : null}
          </FormField>
        ) : (
          <EmployeeFormField
            field={getField('amount')}
            value={values.amount}
            error={fieldErrors.amount}
            onChange={handleChange}
          />
        )}

        <OptionalNotesField
          field={getField('notes')}
          value={values.notes}
          onChange={handleChange}
        />
      </FormStack>
    </EmployeeFormShell>
  )
}
