import { useEffect, useState } from 'react'
import type { CollectionSchema, CollectionDocument } from '../../schema/types'
import type { FormFieldDef } from '../../schema/types'
import { ReferenceFieldSelect } from './ReferenceFieldSelect'
import './Collection.css'

type CollectionFormModalProps = {
  open: boolean
  schema: CollectionSchema
  editingRow: CollectionDocument | null
  isPending?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void
}

function getInitialValues(
  fields: FormFieldDef[],
  row: CollectionDocument | null,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of fields) {
    const raw = row?.[field.key]
    if (field.type === 'boolean') {
      values[field.key] = raw === true || raw === 'true' ? 'true' : 'false'
    } else if (field.type === 'enum') {
      values[field.key] = raw == null || raw === '' ? '' : String(raw)
    } else {
      values[field.key] = raw == null ? '' : String(raw)
    }
  }
  return values
}

function buildPayload(
  fields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, unknown> | null {
  const payload: Record<string, unknown> = {}

  for (const field of fields) {
    const val = values[field.key] ?? ''

    if (field.required && !String(val).trim()) {
      return null
    }

    if (field.type === 'boolean') {
      payload[field.key] = val === 'true'
    } else if (field.type === 'number') {
      payload[field.key] = val === '' ? '' : Number(val)
    } else if (field.type === 'enum') {
      payload[field.key] = val === '' ? null : val
    } else {
      payload[field.key] = val
    }
  }

  return payload
}

export function CollectionFormModal({
  open,
  schema,
  editingRow,
  isPending = false,
  error = null,
  onClose,
  onSubmit,
}: CollectionFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(schema.form.fields, editingRow))
    }
  }, [open, editingRow, schema.form.fields])

  if (!open) return null

  const title = editingRow
    ? (schema.form.editTitle ?? `עריכת ${schema.label}`)
    : (schema.form.createTitle ?? `הוספת ${schema.label}`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = buildPayload(schema.form.fields, values)
    if (!payload) return
    onSubmit(payload)
  }

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <form onSubmit={handleSubmit}>
          {schema.form.fields.map((field) => (
            <div key={field.key} className="form-field">
              <label className="form-label" htmlFor={`field-${field.key}`}>
                {field.label}
                {field.required && ' *'}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={`field-${field.key}`}
                  className="form-textarea"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  required={field.required}
                />
              ) : field.type === 'reference' && field.referenceCollection ? (
                <ReferenceFieldSelect
                  collection={field.referenceCollection}
                  value={values[field.key] ?? ''}
                  required={field.required}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [field.key]: value }))
                  }
                />
              ) : field.type === 'boolean' ? (
                <select
                  id={`field-${field.key}`}
                  className="form-input"
                  value={values[field.key] ?? 'true'}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                >
                  <option value="true">פעיל</option>
                  <option value="false">לא פעיל</option>
                </select>
              ) : field.type === 'select' || field.type === 'enum' ? (
                <select
                  id={`field-${field.key}`}
                  className="form-input"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  required={field.required}
                >
                  <option value="">ללא</option>
                  {field.enumOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`field-${field.key}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="form-input"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  required={field.required}
                />
              )}
            </div>
          ))}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
            >
              ביטול
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
