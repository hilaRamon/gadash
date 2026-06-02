import { useEffect, useState } from "react";
import styled from "styled-components";
import type {
  CollectionDocument,
  CollectionSchema,
} from "../../../schema/types";
import { buildPayload, getInitialValues, getRequiredFieldErrors } from "./helpers";
import { FormFieldControl } from "./FormFieldControl";
import { buttonBaseStyles, fieldControlStyles } from "./sharedStyles";

type CollectionFormModalProps = {
  open: boolean;
  schema: CollectionSchema;
  editingRow: CollectionDocument | null;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
`;

const Modal = styled.div`
  width: 100%;
  max-width: 28rem;
  max-height: 90vh;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
`;

const Form = styled.form`
  .form-input {
    ${fieldControlStyles}
  }

  .form-error {
    margin: 0 0 1rem;
    color: #fc8181;
    font-size: 0.875rem;
  }
`;

const FormField = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const SecondaryButton = styled.button`
  ${buttonBaseStyles}
  background: transparent;

  &:hover:not(:disabled) {
    background: var(--hover-bg);
  }
`;

const PrimaryButton = styled.button`
  ${buttonBaseStyles}
  background: var(--accent);
  border-color: transparent;
  color: #0d1114;
  font-weight: 600;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
`;

const ErrorMessage = styled.p`
  margin: 0 0 1rem;
  color: #fc8181;
  font-size: 0.875rem;
`;

const FieldErrorMessage = styled.p`
  margin: 0.35rem 0 0;
  color: #fc8181;
  font-size: 0.75rem;
`;

export function CollectionFormModal({
  open,
  schema,
  editingRow,
  isPending = false,
  error = null,
  onClose,
  onSubmit,
}: CollectionFormModalProps) {
  // Title: form state for editable field values.
  const [values, setValues] = useState<Record<string, string>>({});
  // Title: inline validation message shown inside the modal.
  const [validationError, setValidationError] = useState<string | null>(null);
  // Title: helper errors shown under specific required fields.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(schema.form.fields, editingRow));
      setValidationError(null);
      setFieldErrors({});
    }
  }, [open, editingRow, schema.form.fields]);

  if (!open) return null;

  // Title: computed modal heading for create vs edit mode.
  const title = editingRow
    ? (schema.form.editTitle ?? `עריכת ${schema.label}`)
    : (schema.form.createTitle ?? `הוספת ${schema.label}`);

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getBooleanLabels = (fieldKey: string) => {
    const matchingColumn = schema.columns.find(
      (column) => column.key === fieldKey && column.type === "boolean",
    );

    if (matchingColumn?.format) {
      return {
        trueLabel: matchingColumn.format(true, {} as CollectionDocument),
        falseLabel: matchingColumn.format(false, {} as CollectionDocument),
      };
    }

    return {
      trueLabel: "כן",
      falseLabel: "לא",
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFieldErrors = getRequiredFieldErrors(schema.form.fields, values);
    if (Object.keys(requiredFieldErrors).length > 0) {
      setFieldErrors(requiredFieldErrors);
      setValidationError(null);
      return;
    }

    setFieldErrors({});
    const payload = buildPayload(schema.form.fields, values);
    if (!payload) return;

    if ("error" in payload && typeof payload.error === "string") {
      setValidationError(payload.error);
      return;
    }

    setValidationError(null);
    onSubmit(payload);
  };

  return (
    <Overlay role="presentation" onClick={onClose}>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalTitle id="modal-title">{title}</ModalTitle>
        <Form onSubmit={handleSubmit} noValidate>
          {schema.form.fields.map((field) => (
            <FormField key={field.key}>
              <Label htmlFor={`field-${field.key}`}>
                {field.label}
                {field.required && " *"}
              </Label>
              <FormFieldControl
                field={field}
                value={values[field.key] ?? ""}
                setFieldValue={setFieldValue}
                booleanLabels={
                  field.type === "boolean" ? getBooleanLabels(field.key) : undefined
                }
              />
              {fieldErrors[field.key] && (
                <FieldErrorMessage>{fieldErrors[field.key]}</FieldErrorMessage>
              )}
            </FormField>
          ))}

          {(validationError || error) && (
            <ErrorMessage>{validationError ?? error}</ErrorMessage>
          )}

          <Actions>
            <SecondaryButton
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              ביטול
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isPending}>
              {isPending ? "שומר..." : "שמור"}
            </PrimaryButton>
          </Actions>
        </Form>
      </Modal>
    </Overlay>
  );
}
