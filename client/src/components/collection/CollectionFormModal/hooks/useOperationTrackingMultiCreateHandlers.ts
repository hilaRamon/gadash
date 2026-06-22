import type { Dispatch, SetStateAction } from "react";
import type { CollectionDocument } from "../../../../schema/types";
import {
  toggleOperationTrackingLine,
  updateOperationTrackingLine,
  type OperationTrackingLineEntry,
} from "../operationTrackingForm";

type UseOperationTrackingMultiCreateHandlersOptions = {
  plotId: string;
  startTime: string;
  endTime: string;
  operations: CollectionDocument[];
  plots: CollectionDocument[];
  setOperationTrackingEntries: Dispatch<
    SetStateAction<OperationTrackingLineEntry[]>
  >;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
};

export function useOperationTrackingMultiCreateHandlers({
  plotId,
  startTime,
  endTime,
  operations,
  plots,
  setOperationTrackingEntries,
  setFieldErrors,
}: UseOperationTrackingMultiCreateHandlersOptions) {
  const context = { operations, plots, plotId, startTime, endTime };

  const onToggleOperation = (operationId: string, checked: boolean) => {
    setOperationTrackingEntries((entries) =>
      toggleOperationTrackingLine(entries, operationId, checked, context),
    );
    setFieldErrors((prev) => {
      if (!prev.operations && !prev[operationId]) return prev;
      const next = { ...prev };
      delete next.operations;
      delete next[operationId];
      return next;
    });
  };

  const onUpdateLine = (
    operationId: string,
    patch: Partial<Pick<OperationTrackingLineEntry, "operationId" | "amount">>,
  ) => {
    setOperationTrackingEntries((entries) =>
      updateOperationTrackingLine(entries, operationId, patch, context),
    );
    setFieldErrors((prev) => {
      const nextKey = patch.operationId ?? operationId;
      if (!prev[operationId] && !prev[nextKey]) return prev;
      const next = { ...prev };
      delete next[operationId];
      delete next[nextKey];
      return next;
    });
  };

  return { onToggleOperation, onUpdateLine };
}
