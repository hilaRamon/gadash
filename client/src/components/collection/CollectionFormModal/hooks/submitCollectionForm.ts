import type { Dispatch, SetStateAction } from "react";
import type {
  CollectionDocument,
  CollectionSchema,
  FormFieldDef,
} from "../../../../schema/types";
import { buildPayload, getRequiredFieldErrors } from "../helpers";
import {
  enrichBaleOrderPayload,
  getBaleOrderRequiredErrors,
} from "../baleOrderForm";
import {
  enrichContractorTrackingPayload,
  getContractorTrackingRequiredErrors,
} from "../contractorTrackingForm";
import {
  buildMaterialUsageCreatePayloads,
  enrichMaterialUsagePayload,
  getMaterialUsageMultiCreateErrors,
  type MaterialUsageLineEntry,
} from "../materialUsageTrackingForm";
import {
  enrichOperationTrackingPayload,
  getOperationTrackingRequiredErrors,
} from "../operationTrackingForm";
import {
  enrichTransportTrackingPayload,
  getTransportTrackingRequiredErrors,
} from "../transportTrackingForm";

export type SubmitCollectionFormOptions = {
  schema: CollectionSchema;
  values: Record<string, string>;
  visibleFields: FormFieldDef[];
  materialUsageEntries: MaterialUsageLineEntry[];
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
  isAdminTrackingForm: boolean;
  isMaterialUsageMultiCreate: boolean;
  isMaterialUsageForm: boolean;
  isContractorTrackingForm: boolean;
  isOperationTrackingForm: boolean;
  isTransportTrackingForm: boolean;
  isBaleOrderForm: boolean;
  operations: CollectionDocument[];
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setValidationError: Dispatch<SetStateAction<string | null>>;
  onSubmit: (values: Record<string, unknown> | Record<string, unknown>[]) => void;
};

export function submitCollectionForm({
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
}: SubmitCollectionFormOptions): void {
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
    : isMaterialUsageMultiCreate
      ? schema.form.fields.filter(
          (field) => field.key !== "material" && field.key !== "amount",
        )
      : schema.form.fields;

  const fieldsForValidation = fieldsForSubmit.filter((field) =>
    visibleFields.some((v) => v.key === field.key),
  );
  const requiredFieldErrors = isContractorTrackingForm
    ? getContractorTrackingRequiredErrors(fieldsForValidation, values)
    : isOperationTrackingForm
      ? getOperationTrackingRequiredErrors(fieldsForValidation, values, operations)
    : isTransportTrackingForm
      ? getTransportTrackingRequiredErrors(fieldsForValidation, values)
      : isBaleOrderForm
        ? getBaleOrderRequiredErrors(fieldsForValidation, values)
        : getRequiredFieldErrors(fieldsForValidation, values);
  const materialUsageErrors = isMaterialUsageMultiCreate
    ? getMaterialUsageMultiCreateErrors(materialUsageEntries)
    : {};
  const mergedFieldErrors = {
    ...requiredFieldErrors,
    ...materialUsageErrors,
  };
  if (Object.keys(mergedFieldErrors).length > 0) {
    setFieldErrors(mergedFieldErrors);
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
    const enriched = isOperationTrackingForm
      ? enrichOperationTrackingPayload(payload, values, operations, plots)
      : payload;
    onSubmit({ ...enriched, billable: false, plot: null });
    return;
  }
  if (isContractorTrackingForm) {
    onSubmit(enrichContractorTrackingPayload(payload, values));
    return;
  }
  if (isOperationTrackingForm) {
    onSubmit(
      enrichOperationTrackingPayload(payload, values, operations, plots),
    );
    return;
  }
  if (isTransportTrackingForm) {
    onSubmit(enrichTransportTrackingPayload(payload, values));
    return;
  }
  if (isBaleOrderForm) {
    onSubmit(enrichBaleOrderPayload(payload, values));
    return;
  }
  if (isMaterialUsageForm) {
    if (isMaterialUsageMultiCreate) {
      onSubmit(
        buildMaterialUsageCreatePayloads(
          payload,
          materialUsageEntries,
          values,
          { materials, plots, editingRow },
        ),
      );
    } else {
      onSubmit(
        enrichMaterialUsagePayload(payload, values, {
          materials,
          plots,
          editingRow,
        }),
      );
    }
    return;
  }
  onSubmit(payload);
}
