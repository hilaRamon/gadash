import { useRef, useState } from "react";
import styled, { css } from "styled-components";
import type {
  CollectionDocument,
  CollectionSchema,
} from "../../../schema/types";
import { useCollectionList } from "../../../hooks/collections/useCollectionList";
import {
  applyBaleOrderFieldChange,
  getBaleOrderVisibleFields,
} from "./baleOrderForm";
import {
  applyContractorTrackingFieldChange,
  getContractorTrackingVisibleFields,
} from "./contractorTrackingForm";
import {
  applyMaterialUsageFieldChange,
  type MaterialUsageLineEntry,
} from "./materialUsageTrackingForm";
import { MaterialUsageMultiCreateFields } from "./MaterialUsageMultiCreateFields";
import { applyOperationTrackingFieldChange } from "./operationTrackingForm";
import {
  applyTransportTrackingFieldChange,
} from "./transportTrackingForm";
import { FormFieldControl } from "./FormFieldControl";
import {
  useCollectionFormInitEffects,
  useCollectionFormUpdateEffects,
  submitCollectionForm,
  useMaterialUsageMultiCreateHandlers,
} from "./hooks";
type CollectionFormModalProps = {
  open: boolean;
  schema: CollectionSchema;
  editingRow: CollectionDocument | null;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown> | Record<string, unknown>[]) => void;
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

const Modal = styled.div<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "32rem" : "28rem")};
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

const InfoMessage = styled.p`
  margin: 0 0 1rem;
  color: #63b3ed;
  font-size: 0.875rem;
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
  const [amountRecalcNotice, setAmountRecalcNotice] = useState<string | null>(null);
  const [materialUsageEntries, setMaterialUsageEntries] = useState<
    MaterialUsageLineEntry[]
  >([]);
  const materialUsagePlotRef = useRef("");

  const isBaleOrderForm = schema.collection === "baleOrderTrackings";
  const isContractorTrackingForm = schema.collection === "contractorTrackings";
  const isTransportTrackingForm = schema.collection === "transportTrackings";
  const isMaterialUsageForm = schema.collection === "materialUsageTrackings";
  const isMaterialUsageMultiCreate = isMaterialUsageForm && !editingRow;
  const isOperationTrackingForm = schema.collection === "operationsTrackings";
  const { data: bales = [] } = useCollectionList("bales");
  const { data: movers = [] } = useCollectionList("movers");
  const { data: materials = [] } = useCollectionList("materials");
  const { data: plots = [] } = useCollectionList("plots");
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
    if (isBaleOrderForm) {
      return getBaleOrderVisibleFields(base, values);
    }
    if (isMaterialUsageMultiCreate) {
      return base.filter((field) => field.key !== "material" && field.key !== "amount");
    }
    return base;
  })();

  useCollectionFormInitEffects({
    open,
    schema,
    editingRow,
    operations,
    hiddenOperationField,
    isAdminTrackingForm,
    isContractorTrackingForm,
    isTransportTrackingForm,
    materialUsagePlotRef,
    setValues,
    setValidationError,
    setFieldErrors,
    setAmountRecalcNotice,
    setMaterialUsageEntries,
  });

  useCollectionFormUpdateEffects({
    open,
    isMaterialUsageMultiCreate,
    values,
    materialUsageEntries,
    materials,
    plots,
    materialUsagePlotRef,
    setMaterialUsageEntries,
  });

  const materialUsageHandlers = useMaterialUsageMultiCreateHandlers({
    plotId: values.plot ?? "",
    materials,
    plots,
    setMaterialUsageEntries,
    setFieldErrors,
  });

  if (!open) return null;

  // Title: computed modal heading for create vs edit mode.
  const title = editingRow
    ? (schema.form.editTitle ?? `עריכת ${schema.label}`)
    : (schema.form.createTitle ?? `הוספת ${schema.label}`);

  const setFieldValue = (key: string, value: string) => {
    let shouldUpdateNotice = false;
    let nextNotice: string | null = null;

    setValues((prev) => {
      let next = { ...prev, [key]: value };
      if (isBaleOrderForm) {
        next = applyBaleOrderFieldChange(key, value, prev, bales);
      }
      if (isContractorTrackingForm) {
        next = applyContractorTrackingFieldChange(key, value, next);
      }
      if (isTransportTrackingForm) {
        next = applyTransportTrackingFieldChange(key, value, next, movers);
      }
      if (isMaterialUsageForm) {
        const result = applyMaterialUsageFieldChange(key, value, prev, {
          materials,
          plots,
          editingRow,
        });
        next = result.next;
        shouldUpdateNotice = true;
        nextNotice = result.notice;
      }
      if (isOperationTrackingForm) {
        const result = applyOperationTrackingFieldChange(key, value, prev, {
          operations,
          plots,
          editingRow,
        });
        if (!isAdminTrackingForm) {
          shouldUpdateNotice = true;
          nextNotice = result.notice;
        }
        return result.next;
      }
      return next;
    });

    if (shouldUpdateNotice) {
      setAmountRecalcNotice(nextNotice);
    }

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
      const rowContext = { ...values } as CollectionDocument;
      const trueLabel = matchingColumn.format(true, rowContext);
      const falseLabel = matchingColumn.format(false, rowContext);
      if (trueLabel && falseLabel) {
        return { trueLabel, falseLabel };
      }
    }

    return {
      trueLabel: "כן",
      falseLabel: "לא",
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCollectionForm({
      schema,
      values,
      visibleFields,
      materialUsageEntries,
      materials,
      plots,
      editingRow,
      isAdminTrackingForm,
      isMaterialUsageMultiCreate,
      isMaterialUsageForm,
      isContractorTrackingForm,
      isOperationTrackingForm,
      isTransportTrackingForm,
      isBaleOrderForm,
      operations,
      setFieldErrors,
      setValidationError,
      onSubmit,
    });
  };

  return (
    <Overlay role="presentation" onClick={onClose}>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        $wide={isMaterialUsageMultiCreate}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalTitle id="modal-title">{title}</ModalTitle>
        <form onSubmit={handleSubmit} noValidate>
          {visibleFields.map((field) => (
            <div key={field.key}>
              <FormField>
                <Label htmlFor={`field-${field.key}`}>
                  {field.label}
                  {field.required && " *"}
                </Label>
                <FormFieldControl
                  field={field}
                  value={values[field.key] ?? ""}
                  setFieldValue={setFieldValue}
                  disabled={
                    (isAdminTrackingForm && field.key === "billable") ||
                    (isTransportTrackingForm &&
                      (field.key === "hours" || field.key === "finalPrice"))
                  }
                  booleanLabels={
                    field.type === "boolean" ? getBooleanLabels(field.key) : undefined
                  }
                />
                {fieldErrors[field.key] && (
                  <FieldErrorMessage>{fieldErrors[field.key]}</FieldErrorMessage>
                )}
              </FormField>

              {isMaterialUsageMultiCreate && field.key === "plot" && (
                <MaterialUsageMultiCreateFields
                  materials={materials}
                  entries={materialUsageEntries}
                  fieldErrors={fieldErrors}
                  plotId={values.plot ?? ""}
                  onToggleMaterial={materialUsageHandlers.onToggleMaterial}
                  onUpdateLine={materialUsageHandlers.onUpdateLine}
                />
              )}
            </div>
          ))}

          {(validationError || error) && (
            <ErrorMessage>{validationError ?? error}</ErrorMessage>
          )}

          {amountRecalcNotice && (
            <InfoMessage role="status">{amountRecalcNotice}</InfoMessage>
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
