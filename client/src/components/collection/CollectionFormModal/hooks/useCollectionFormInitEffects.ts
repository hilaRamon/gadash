import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type {
  CollectionDocument,
  CollectionSchema,
  FormFieldDef,
} from "../../../../schema/types";
import { getInitialValues } from "../helpers";
import { inferBaleOrderPricingForm } from "../baleOrderForm";
import { applyContractorTrackingFieldChange } from "../contractorTrackingForm";
import {
  calcFinalPrice,
  calcHoursBetween,
} from "../../../../lib/transportTrackingPricing";
import type { MaterialUsageLineEntry } from "../materialUsageTrackingForm";
import type { OperationTrackingLineEntry } from "../operationTrackingForm";

type UseCollectionFormInitEffectsOptions = {
  open: boolean;
  schema: CollectionSchema;
  editingRow: CollectionDocument | null;
  operations: CollectionDocument[];
  hiddenOperationField: FormFieldDef | undefined;
  isAdminTrackingForm: boolean;
  isContractorTrackingForm: boolean;
  isTransportTrackingForm: boolean;
  plots: CollectionDocument[];
  materialUsagePlotRef: MutableRefObject<string>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  setValidationError: Dispatch<SetStateAction<string | null>>;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setAmountRecalcNotice: Dispatch<SetStateAction<string | null>>;
  setMaterialUsageEntries: Dispatch<SetStateAction<MaterialUsageLineEntry[]>>;
  setOperationTrackingEntries: Dispatch<
    SetStateAction<OperationTrackingLineEntry[]>
  >;
};

export function useCollectionFormInitEffects({
  open,
  schema,
  editingRow,
  operations,
  hiddenOperationField,
  isAdminTrackingForm,
  isContractorTrackingForm,
  isTransportTrackingForm,
  plots,
  materialUsagePlotRef,
  setValues,
  setValidationError,
  setFieldErrors,
  setAmountRecalcNotice,
  setMaterialUsageEntries,
  setOperationTrackingEntries,
}: UseCollectionFormInitEffectsOptions) {
  useEffect(() => {
    if (open) {
      const initial = getInitialValues(schema.form.fields, editingRow);
      if (schema.collection === "baleOrderTrackings") {
        initial.pricingForm = inferBaleOrderPricingForm(editingRow);
      }
      setValues(initial);
      setValidationError(null);
      setFieldErrors({});
      setAmountRecalcNotice(null);
      setMaterialUsageEntries([]);
      setOperationTrackingEntries([]);
      materialUsagePlotRef.current = "";
    }
  }, [
    open,
    editingRow,
    schema.form.fields,
    schema.collection,
    materialUsagePlotRef,
    setValues,
    setValidationError,
    setFieldErrors,
    setAmountRecalcNotice,
    setMaterialUsageEntries,
    setOperationTrackingEntries,
  ]);

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
  }, [open, hiddenOperationField, operations, editingRow, setValues]);

  useEffect(() => {
    if (!open || !isAdminTrackingForm) return;
    setValues((prev) => {
      const next = { ...prev, billable: "false", plot: "" };
      if (prev.billable === "false" && prev.plot === "") return prev;
      return next;
    });
  }, [open, isAdminTrackingForm, setValues]);

  useEffect(() => {
    if (!open || !isContractorTrackingForm) return;
    setValues((prev) =>
      applyContractorTrackingFieldChange("pricingForm", prev.pricingForm ?? "", prev, {
        plots,
        onlyIfEmptyUnitAmount: editingRow != null,
      }),
    );
  }, [open, isContractorTrackingForm, editingRow, plots, setValues]);

  useEffect(() => {
    if (!open || !isTransportTrackingForm) return;
    setValues((prev) => {
      const hours = calcHoursBetween(prev.startTime ?? "", prev.endTime ?? "");
      if (hours == null) return prev;
      const rate = Number(prev.hourlyRate);
      return {
        ...prev,
        hours: String(hours),
        finalPrice: Number.isFinite(rate)
          ? String(calcFinalPrice(rate, hours))
          : prev.finalPrice ?? "",
      };
    });
  }, [open, isTransportTrackingForm, setValues]);
}
