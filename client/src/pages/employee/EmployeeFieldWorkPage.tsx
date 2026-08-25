import { useEffect, useMemo, useState } from 'react'
import {
  applyOperationTrackingFieldChange,
  buildPlotTrackingCreatePayloads,
  enrichOperationTrackingPayload,
  getOperationTrackingRequiredErrors,
  getPlotTrackingMultiCreateErrors,
  recalcPlotTrackingLineAmounts,
  togglePlotTrackingLine,
  updatePlotTrackingLine,
  type PlotTrackingLineEntry,
} from "@/components/collection/CollectionFormModal/operationTrackingForm"
import { PlotMultiCreateFields } from "@/components/collection/CollectionFormModal/PlotMultiCreateFields"
import {
  buildPayload,
  getInitialValues,
} from "@/components/collection/CollectionFormModal/helpers"
import { useCollectionList } from "@/queries/collections/useCollectionList"
import { useCreateDocument } from "@/queries/collections/useCollectionMutations"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { isoToDateDisplay } from "@/lib/dateFieldFormat"
import {
  OPERATION_PRICING_BY_DUNAM,
  OPERATION_PRICING_BY_UNIT,
  OPERATION_PRICING_HOURLY,
} from "@/lib/operationTrackingPricing"
import {
  operationsTrackingsAdminSchema,
  operationsTrackingsFieldWorkSchema,
} from "@/schema/collections/operationsTrackingsSchema"
import type { FormFieldDef } from "@/schema/types"
import {
  EmployeeAdminFormFields,
  employeeAdminVisibleFields,
} from './components/EmployeeAdminFormFields'
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

const formFields = operationsTrackingsFieldWorkSchema.form.fields
const adminFormFields = operationsTrackingsAdminSchema.form.fields
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
  const [plotEntries, setPlotEntries] = useState<PlotTrackingLineEntry[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useFormSuccessRedirect(success)

  useEffect(() => {
    if (employeeId) {
      setValues((prev) => ({
        ...prev,
        employee: employeeId,
        date: isoToDateDisplay(trackingDate),
      }))
    }
  }, [employeeId, trackingDate])

  const selectedOperation = useMemo(
    () =>
      operations.find((row) => String(row._id) === values.operation) ?? null,
    [operations, values.operation],
  )
  const selectedOperationType = String(selectedOperation?.operationType ?? '')
  const isAdminOperation = selectedOperationType === 'מנהלה'

  const pricingForm = String(
    selectedOperation?.pricingForm ?? OPERATION_PRICING_BY_DUNAM,
  )
  const isMultiPlotMode =
    !isAdminOperation &&
    Boolean(values.operation) &&
    pricingForm === OPERATION_PRICING_BY_DUNAM

  const amountField = useMemo(() => {
    const base = getField('amount')
    if (pricingForm === OPERATION_PRICING_BY_UNIT) {
      return { ...base, label: 'כמות יחידות' }
    }
    if (pricingForm === OPERATION_PRICING_BY_DUNAM) {
      return { ...base, label: 'דונם' }
    }
    return base
  }, [pricingForm])

  const showAmountField =
    !isAdminOperation &&
    !isMultiPlotMode &&
    Boolean(values.operation) &&
    pricingForm !== OPERATION_PRICING_HOURLY

  const fieldWorkVisibleFields = useMemo(
    () =>
      formFields.filter((field) => {
        if (field.hidden || hiddenKeys.has(field.key)) return false
        if (isMultiPlotMode && (field.key === 'plot' || field.key === 'amount')) {
          return false
        }
        return true
      }),
    [isMultiPlotMode],
  )

  const visibleFields = isAdminOperation
    ? employeeAdminVisibleFields
    : fieldWorkVisibleFields
  const submitFormFields = isAdminOperation ? adminFormFields : formFields

  const plotAmountContext = useMemo(
    () => ({
      plots,
      operations,
      operationId: values.operation,
      startTime: values.startTime,
      endTime: values.endTime,
    }),
    [plots, operations, values.operation, values.startTime, values.endTime],
  )

  useEffect(() => {
    setValues((prev) => {
      if (!prev.operation.trim()) {
        return prev.billable === 'true'
          ? prev
          : { ...prev, billable: 'true' }
      }

      if (isAdminOperation) {
        const next = {
          ...prev,
          billable: 'false',
          plot: '',
          amount: '',
        }
        return (
          next.billable === prev.billable &&
          next.plot === prev.plot &&
          next.amount === prev.amount
        )
          ? prev
          : next
      }

      return prev.billable === 'true'
        ? prev
        : { ...prev, billable: 'true' }
    })
  }, [isAdminOperation])

  useEffect(() => {
    if (!isMultiPlotMode) {
      setPlotEntries((prev) => (prev.length === 0 ? prev : []))
      return
    }

    setPlotEntries((prev) => {
      if (prev.length === 0) return prev
      return recalcPlotTrackingLineAmounts(prev, plotAmountContext)
    })
  }, [isMultiPlotMode, plotAmountContext])

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
      if (key === 'operation') {
        next.plot = ''
        if (String(
          operations.find((row) => String(row._id) === value)?.pricingForm ?? '',
        ) === OPERATION_PRICING_BY_DUNAM) {
          next.amount = ''
        }
      }
      return next
    })
  }

  const handleTogglePlot = (plotId: string, checked: boolean) => {
    setPlotEntries((entries) =>
      togglePlotTrackingLine(entries, plotId, checked, plotAmountContext),
    )
    setFieldErrors((prev) => {
      if (!prev.plots && !prev[plotId]) return prev
      const next = { ...prev }
      delete next.plots
      delete next[plotId]
      return next
    })
  }

  const handleUpdatePlotLine = (
    plotId: string,
    patch: Partial<Pick<PlotTrackingLineEntry, 'plotId' | 'amount'>>,
  ) => {
    setPlotEntries((entries) =>
      updatePlotTrackingLine(entries, plotId, patch, plotAmountContext),
    )
    setFieldErrors((prev) => {
      const nextKey = patch.plotId ?? plotId
      if (!prev[plotId] && !prev[nextKey]) return prev
      const next = { ...prev }
      delete next[plotId]
      delete next[nextKey]
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

    if (isMultiPlotMode) {
      Object.assign(errors, getPlotTrackingMultiCreateErrors(plotEntries))
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payloadValues = isMultiPlotMode
      ? { ...values, plot: '', amount: '' }
      : values
    const payloadFields = isMultiPlotMode
      ? submitFormFields.map((field) =>
          field.key === 'plot' || field.key === 'amount'
            ? { ...field, required: false }
            : field,
        )
      : submitFormFields
    const payloadResult = buildPayload(payloadFields, payloadValues)
    if (payloadResult == null) {
      setError('יש למלא את כל שדות החובה')
      return
    }
    if ('error' in payloadResult) {
      setError(String(payloadResult.error))
      return
    }

    try {
      if (isMultiPlotMode) {
        const payloads = buildPlotTrackingCreatePayloads(
          payloadResult,
          plotEntries,
          payloadValues,
          { operations, plots, editingRow: null },
        )
        for (const payload of payloads) {
          await createMutation.mutateAsync(payload)
        }
      } else {
        const enriched = enrichOperationTrackingPayload(
          payloadResult,
          values,
          operations,
          plots,
        )
        await createMutation.mutateAsync(enriched)
      }
      setSuccess(true)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    }
  }

  return (
    <EmployeeFormShell
      title="דיווח על משימה"
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

        {isAdminOperation ? (
          <EmployeeAdminFormFields
            values={values}
            fieldErrors={fieldErrors}
            onChange={handleChange}
          />
        ) : (
          <>
            {isMultiPlotMode ? (
              <PlotMultiCreateFields
                plots={plots}
                entries={plotEntries}
                fieldErrors={fieldErrors}
                onTogglePlot={handleTogglePlot}
                onUpdateLine={handleUpdatePlotLine}
              />
            ) : (
              <EmployeeFormField
                field={getField('plot')}
                value={values.plot}
                error={fieldErrors.plot}
                onChange={handleChange}
              />
            )}

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

            {showAmountField ? (
              <EmployeeFormField
                field={amountField}
                value={values.amount}
                error={fieldErrors.amount}
                onChange={handleChange}
              />
            ) : null}

            <OptionalNotesField
              field={getField('notes')}
              value={values.notes}
              onChange={handleChange}
            />
          </>
        )}
      </FormStack>
    </EmployeeFormShell>
  )
}
