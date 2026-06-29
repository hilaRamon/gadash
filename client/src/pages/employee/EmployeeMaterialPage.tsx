import { useEffect, useMemo, useState } from 'react'
import { enrichMaterialUsagePayload } from '../../components/collection/CollectionFormModal/materialUsageTrackingForm'
import {
  buildPayload,
  getInitialValues,
  getRequiredFieldErrors,
  numberToFormFieldValue,
} from '../../components/collection/CollectionFormModal/helpers'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { useCreateDocument } from '../../hooks/collections/useCollectionMutations'
import { getApiErrorMessage } from '../../lib/apiErrorMessage'
import { calcMaterialUsageAmount } from '../../lib/materialUsageAmount'
import { materialUsageTrackingsSchema } from '../../schema/collections/materialUsageTrackingsSchema'
import type { CollectionDocument, FormFieldDef } from '../../schema/types'
import { EmployeeFormField } from './components/EmployeeFormField'
import { EmployeeFormShell } from './components/EmployeeFormShell'
import { OptionalNotesField } from './components/OptionalNotesField'
import { useEmployee } from './context/EmployeeContext'
import { useFormSuccessRedirect } from './hooks/useFormSuccessRedirect'
import { useRequireEmployee } from './hooks/useRequireEmployee'
import { FormStack } from './employeeStyles'

const formFields = materialUsageTrackingsSchema.form.fields
const hiddenKeys = new Set(['date', 'employee', 'billable', 'wasCharged', 'amount'])

const dunamField: FormFieldDef = {
  key: 'dunam',
  label: 'דונם',
  type: 'number',
  required: true,
}

function getField(key: string): FormFieldDef {
  const field = formFields.find((item) => item.key === key)
  if (!field) throw new Error(`Missing form field: ${key}`)
  return field
}

function plotDunamFormValue(
  plotId: string,
  plots: CollectionDocument[],
): string {
  const plot = plots.find((row) => String(row._id) === plotId)
  if (!plot) return ''
  const dunam = Number(plot.dunam)
  return Number.isFinite(dunam) ? numberToFormFieldValue(dunam) : ''
}

export function EmployeeMaterialPage() {
  useRequireEmployee()
  const { employeeId, trackingDate } = useEmployee()
  const { data: materials = [] } = useCollectionList('materials')
  const { data: plots = [] } = useCollectionList('plots')
  const createMutation = useCreateDocument('materialUsageTrackings')

  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...getInitialValues(formFields, null),
    dunam: '',
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
      const next = { ...prev, [key]: value }
      if (key === 'plot') {
        next.dunam = plotDunamFormValue(value, plots)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    const requiredErrors = getRequiredFieldErrors(visibleFields, values)
    const errors = { ...requiredErrors }

    const dunam = Number(values.dunam)
    if (!values.dunam.trim() || !Number.isFinite(dunam) || dunam < 0) {
      errors.dunam = 'שדה חובה'
    }

    const material = materials.find(
      (row) => String(row._id) === values.material,
    )
    const amountPerDunam = Number(material?.amountPerDunam)
    if (!material || !Number.isFinite(amountPerDunam)) {
      errors.material = 'לחומר שנבחר אין כמות לדונם'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const amount = calcMaterialUsageAmount(dunam, amountPerDunam)
    if (amount == null) {
      setFieldErrors({ dunam: 'כמות לא תקינה' })
      return
    }

    const submitValues = {
      ...values,
      amount: numberToFormFieldValue(amount),
    }

    const payloadResult = buildPayload(formFields, submitValues)
    if (payloadResult == null) {
      setError('יש למלא את כל שדות החובה')
      return
    }
    if ('error' in payloadResult) {
      setError(String(payloadResult.error))
      return
    }

    const enriched = enrichMaterialUsagePayload(payloadResult, submitValues, {
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

        {values.plot ? (
          <EmployeeFormField
            field={dunamField}
            value={values.dunam}
            error={fieldErrors.dunam}
            onChange={handleChange}
          />
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
