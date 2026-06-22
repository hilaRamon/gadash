import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { CollectionDocument } from "../../../../schema/types";
import {
  recalcMaterialUsageLineAmounts,
  type MaterialUsageLineEntry,
} from "../materialUsageTrackingForm";
import {
  recalcOperationTrackingLineAmounts,
  type OperationTrackingLineEntry,
} from "../operationTrackingForm";

type UseCollectionFormUpdateEffectsOptions = {
  open: boolean;
  isMaterialUsageMultiCreate: boolean;
  isOperationTrackingMultiCreate: boolean;
  values: Record<string, string>;
  materialUsageEntries: MaterialUsageLineEntry[];
  operationTrackingEntries: OperationTrackingLineEntry[];
  materials: CollectionDocument[];
  operations: CollectionDocument[];
  plots: CollectionDocument[];
  materialUsagePlotRef: MutableRefObject<string>;
  operationTrackingContextRef: MutableRefObject<string>;
  setMaterialUsageEntries: Dispatch<SetStateAction<MaterialUsageLineEntry[]>>;
  setOperationTrackingEntries: Dispatch<
    SetStateAction<OperationTrackingLineEntry[]>
  >;
};

export function useCollectionFormUpdateEffects({
  open,
  isMaterialUsageMultiCreate,
  isOperationTrackingMultiCreate,
  values,
  materialUsageEntries,
  operationTrackingEntries,
  materials,
  operations,
  plots,
  materialUsagePlotRef,
  operationTrackingContextRef,
  setMaterialUsageEntries,
  setOperationTrackingEntries,
}: UseCollectionFormUpdateEffectsOptions) {
  useEffect(() => {
    if (!open || !isMaterialUsageMultiCreate) return;

    const plotId = values.plot?.trim() ?? "";
    if (!plotId || materialUsageEntries.length === 0) return;
    if (materials.length === 0 || plots.length === 0) return;

    const plotChanged = materialUsagePlotRef.current !== plotId;
    materialUsagePlotRef.current = plotId;

    setMaterialUsageEntries((entries) => {
      if (entries.length === 0) return entries;
      const next = recalcMaterialUsageLineAmounts(
        entries,
        plotId,
        { materials, plots },
        { onlyEmpty: !plotChanged },
      );
      const unchanged = entries.every(
        (entry, index) =>
          entry.materialId === next[index]?.materialId &&
          entry.amount === next[index]?.amount,
      );
      return unchanged ? entries : next;
    });
  }, [
    open,
    isMaterialUsageMultiCreate,
    values.plot,
    materialUsageEntries.length,
    materials,
    plots,
    materialUsagePlotRef,
    setMaterialUsageEntries,
  ]);

  useEffect(() => {
    if (!open || !isOperationTrackingMultiCreate) return;
    if (operationTrackingEntries.length === 0) return;
    if (operations.length === 0 || plots.length === 0) return;

    const plotId = values.plot?.trim() ?? "";
    const startTime = values.startTime?.trim() ?? "";
    const endTime = values.endTime?.trim() ?? "";
    const contextKey = `${plotId}|${startTime}|${endTime}`;
    const contextChanged = operationTrackingContextRef.current !== contextKey;
    operationTrackingContextRef.current = contextKey;

    setOperationTrackingEntries((entries) => {
      if (entries.length === 0) return entries;
      const next = recalcOperationTrackingLineAmounts(
        entries,
        { operations, plots, plotId, startTime, endTime },
        { onlyEmpty: !contextChanged },
      );
      const unchanged = entries.every(
        (entry, index) =>
          entry.operationId === next[index]?.operationId &&
          entry.amount === next[index]?.amount,
      );
      return unchanged ? entries : next;
    });
  }, [
    open,
    isOperationTrackingMultiCreate,
    values.plot,
    values.startTime,
    values.endTime,
    operationTrackingEntries.length,
    operations,
    plots,
    operationTrackingContextRef,
    setOperationTrackingEntries,
  ]);
}
