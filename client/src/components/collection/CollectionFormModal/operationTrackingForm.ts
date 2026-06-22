import type { CollectionDocument } from "../../../schema/types";
import { formatNumber } from "../../../lib/formatNumber";

type OperationTrackingFormContext = {
  operations: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
};

function resolvePricingFromSelections(
  values: Record<string, string>,
  context: OperationTrackingFormContext,
): { unitCost: number; dunam: number; finalPrice: number } | null {
  const operation = context.operations.find(
    (row) => String(row._id) === String(values.operation ?? ""),
  );
  const plot = context.plots.find(
    (row) => String(row._id) === String(values.plot ?? ""),
  );
  if (!operation || !plot) return null;

  const unitCost = Number(operation.currentCost ?? 0);
  const dunam = Number(plot.dunam ?? 0);
  if (!Number.isFinite(unitCost) || !Number.isFinite(dunam)) return null;

  return {
    unitCost,
    dunam,
    finalPrice: Number((dunam * unitCost).toFixed(2)),
  };
}

export function applyOperationTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  context: OperationTrackingFormContext,
): { notice: string | null } {
  if (!context.editingRow || (key !== "operation" && key !== "plot")) {
    return { notice: null };
  }

  const next = { ...prev, [key]: value };
  const originalPlot = String(context.editingRow.plot ?? "");
  const originalOperation = String(context.editingRow.operation ?? "");
  const plotChanged =
    key === "plot" && value !== originalPlot && originalPlot !== "";
  const operationChanged =
    key === "operation" && value !== originalOperation && originalOperation !== "";

  if (!plotChanged && !operationChanged) {
    return { notice: null };
  }

  const parts: string[] = [];
  const pricing = resolvePricingFromSelections(next, context);

  if (operationChanged) {
    const operation = context.operations.find(
      (row) => String(row._id) === String(next.operation ?? ""),
    );
    const unitCost = Number(operation?.currentCost ?? 0);
    if (Number.isFinite(unitCost)) {
      parts.push(`מחיר לדונם יעודכן לפי הפעולה החדשה (${formatNumber(unitCost)})`);
    }
  }

  if (plotChanged) {
    const plot = context.plots.find(
      (row) => String(row._id) === String(next.plot ?? ""),
    );
    const dunam = Number(plot?.dunam ?? 0);
    if (Number.isFinite(dunam)) {
      parts.push(`דונם יעודכן לפי החלקה החדשה (${formatNumber(dunam)})`);
    }
  }

  if (pricing) {
    parts.push(`המחיר הסופי יחושב מחדש (${formatNumber(pricing.finalPrice)})`);
  }

  return { notice: parts.length > 0 ? parts.join(". ") : null };
}
