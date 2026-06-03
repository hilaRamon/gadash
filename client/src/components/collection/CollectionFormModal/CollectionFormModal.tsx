import { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import type {
  CollectionDocument,
  CollectionSchema,
} from "../../../schema/types";
import { useCollectionList } from "../../../hooks/collections/useCollectionList";
import { buildPayload, getInitialValues, getRequiredFieldErrors } from "./helpers";
import { applyBaleOrderFieldChange } from "./baleOrderForm";
import {
  applyContractorTrackingFieldChange,
  enrichContractorTrackingPayload,
  getContractorTrackingRequiredErrors,
  getContractorTrackingVisibleFields,
} from "./contractorTrackingForm";
import { FormFieldControl } from "./FormFieldControl";
type CollectionFormModalProps = {
  open: boolean;
  schema: CollectionSchema;
  editingRow: CollectionDocument | null;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
};

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--hover-bg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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
  ${buttonBase};
  background: transparent;
`;

const PrimaryButton = styled.button`
  ${buttonBase};
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

  const isBaleOrderForm = schema.collection === "baleOrderTrackings";
  const isContractorTrackingForm = schema.collection === "contractorTrackings";
  const { data: bales = [] } = useCollectionList("bales");
  const hiddenOperationField = schema.form.fields.find(
    (field) =>
      field.hidden &&
      field.key === "operation" &&
      field.referenceCollection === "operations",
  );
  const { data: operations = [] } = useCollectionList("operations");

  const isAdminTrackingPage = schema.id === "operations-trackings-admin";
  const selectedOperation =
    values.operation && operations.length > 0
      ? operations.find((op) => String(op._id) === values.operation)
      : undefined;
  const isManahelaOperation =
    String(editingRow?.operationType ?? "") === "מנהלה" ||
    String(selectedOperation?.operationType ?? "") === "מנהלה";
  const isAdminTrackingForm =
    isAdminTrackingPage ||
    (schema.collection === "operationsTrackings" && isManahelaOperation);

  const adminFormKeysToHide = new Set(["operation", "plot", "billable"]);
  const visibleFields = (() => {
    const base = schema.form.fields.filter((field) => {
      if (field.hidden) return false;
      if (isAdminTrackingForm && adminFormKeysToHide.has(field.key)) return false;
      return true;
    });
    if (isContractorTrackingForm) {
      return getContractorTrackingVisibleFields(base, values);
    }
    return base;
  })();

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(schema.form.fields, editingRow));
      setValidationError(null);
      setFieldErrors({});
    }
  }, [open, editingRow, schema.form.fields]);

  useEffect(() => {
    if (!open || !hiddenOperationField) return;

    const matching = hiddenOperationField.referenceFilter
      ? operations.filter(hiddenOperationField.referenceFilter)
      : operations;
    if (matching.length !== 1) return;

    const soleOperationId = String(matching[0]._id);
    setValues((prev) => {
      if (prev.operation?.trim()) return prev;
      if (prev.operation === soleOperationId) return prev;
      return { ...prev, operation: soleOperationId };
    });
  }, [open, hiddenOperationField, operations, editingRow]);

  useEffect(() => {
    if (!open || !isAdminTrackingForm) return;
    setValues((prev) => {
      const next = { ...prev, billable: "false", plot: "" };
      if (prev.billable === "false" && prev.plot === "") return prev;
      return next;
    });
  }, [open, isAdminTrackingForm]);

  useEffect(() => {
    if (!open || !isContractorTrackingForm) return;
    setValues((prev) => applyContractorTrackingFieldChange("pricingForm", prev.pricingForm ?? "", prev));
  }, [open, isContractorTrackingForm]);

  if (!open) return null;

  // Title: computed modal heading for create vs edit mode.
  const title = editingRow
    ? (schema.form.editTitle ?? `עריכת ${schema.label}`)
    : (schema.form.createTitle ?? `הוספת ${schema.label}`);

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => {
      let next = { ...prev, [key]: value };
      if (isBaleOrderForm) {
        next = applyBaleOrderFieldChange(key, value, prev, bales);
      }
      if (isContractorTrackingForm) {
        next = applyContractorTrackingFieldChange(key, value, next);
      }
      return next;
    });
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
    const fieldsForSubmit = isAdminTrackingForm
      ? schema.form.fields.map((field) => {
          if (field.key === "plot") {
            return { ...field, hidden: true, required: false, defaultValue: null };
          }
          if (field.key === "billable") {
            return { ...field, hidden: true, defaultValue: false };
          }
          return field;
        })
      : schema.form.fields;

    const fieldsForValidation = fieldsForSubmit.filter((field) =>
      visibleFields.some((v) => v.key === field.key),
    );
    const requiredFieldErrors = isContractorTrackingForm
      ? getContractorTrackingRequiredErrors(fieldsForValidation, values)
      : getRequiredFieldErrors(fieldsForValidation, values);
    if (Object.keys(requiredFieldErrors).length > 0) {
      setFieldErrors(requiredFieldErrors);
      setValidationError(null);
      return;
    }

    setFieldErrors({});
    const payload = buildPayload(fieldsForSubmit, values);
    if (!payload) return;

    if ("error" in payload && typeof payload.error === "string") {
      setValidationError(payload.error);
      return;
    }

    setValidationError(null);
    if (isAdminTrackingForm) {
      onSubmit({ ...payload, billable: false, plot: null });
      return;
    }
    if (isContractorTrackingForm) {
      onSubmit(enrichContractorTrackingPayload(payload, values));
      return;
    }
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
        <form onSubmit={handleSubmit} noValidate>
          {visibleFields.map((field) => (
            <FormField key={field.key}>
              <Label htmlFor={`field-${field.key}`}>
                {field.label}
                {field.required && " *"}
              </Label>
              <FormFieldControl
                field={field}
                value={values[field.key] ?? ""}
                setFieldValue={setFieldValue}
                disabled={isAdminTrackingForm && field.key === "billable"}
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
        </form>
      </Modal>
    </Overlay>
  );
}
