import type { Dispatch, SetStateAction } from "react";
import type { CollectionDocument } from "../../../../schema/types";
import {
  toggleMaterialUsageLine,
  updateMaterialUsageLine,
  type MaterialUsageLineEntry,
} from "../materialUsageTrackingForm";

type UseMaterialUsageMultiCreateHandlersOptions = {
  plotId: string;
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  setMaterialUsageEntries: Dispatch<SetStateAction<MaterialUsageLineEntry[]>>;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
};

export function useMaterialUsageMultiCreateHandlers({
  plotId,
  materials,
  plots,
  setMaterialUsageEntries,
  setFieldErrors,
}: UseMaterialUsageMultiCreateHandlersOptions) {
  const context = { materials, plots };

  const onToggleMaterial = (materialId: string, checked: boolean) => {
    setMaterialUsageEntries((entries) =>
      toggleMaterialUsageLine(entries, materialId, checked, plotId, context),
    );
    setFieldErrors((prev) => {
      if (!prev.materials && !prev[materialId]) return prev;
      const next = { ...prev };
      delete next.materials;
      delete next[materialId];
      return next;
    });
  };

  const onUpdateLine = (
    materialId: string,
    patch: Partial<Pick<MaterialUsageLineEntry, "materialId" | "amount">>,
  ) => {
    setMaterialUsageEntries((entries) =>
      updateMaterialUsageLine(entries, materialId, patch, plotId, context),
    );
    setFieldErrors((prev) => {
      const nextKey = patch.materialId ?? materialId;
      if (!prev[materialId] && !prev[nextKey]) return prev;
      const next = { ...prev };
      delete next[materialId];
      delete next[nextKey];
      return next;
    });
  };

  return { onToggleMaterial, onUpdateLine };
}
