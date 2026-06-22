import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { CollectionDocument } from "../../../../schema/types";
import {
  recalcMaterialUsageLineAmounts,
  type MaterialUsageLineEntry,
} from "../materialUsageTrackingForm";

type UseCollectionFormUpdateEffectsOptions = {
  open: boolean;
  isMaterialUsageMultiCreate: boolean;
  values: Record<string, string>;
  materialUsageEntries: MaterialUsageLineEntry[];
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  materialUsagePlotRef: MutableRefObject<string>;
  setMaterialUsageEntries: Dispatch<SetStateAction<MaterialUsageLineEntry[]>>;
};

export function useCollectionFormUpdateEffects({
  open,
  isMaterialUsageMultiCreate,
  values,
  materialUsageEntries,
  materials,
  plots,
  materialUsagePlotRef,
  setMaterialUsageEntries,
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
}
