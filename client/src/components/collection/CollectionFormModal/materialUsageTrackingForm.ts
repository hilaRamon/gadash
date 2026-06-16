import type { CollectionDocument } from "../../../schema/types";
import { calcMaterialUsageAmount } from "../../../lib/materialUsageAmount";
import { formatNumber } from "../../../lib/formatNumber";

type MaterialUsageFormContext = {
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
};

function resolveAmountFromSelections(
  values: Record<string, string>,
  context: MaterialUsageFormContext,
): number | null {
  const material = context.materials.find(
    (row) => String(row._id) === String(values.material ?? ""),
  );
  const plot = context.plots.find(
    (row) => String(row._id) === String(values.plot ?? ""),
  );
  if (!material || !plot) return null;
  return calcMaterialUsageAmount(
    Number(plot.dunam ?? 0),
    material.amountPerDunam as number | null | undefined,
  );
}

export function applyMaterialUsageFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  context: MaterialUsageFormContext,
): { next: Record<string, string>; notice: string | null } {
  const next = { ...prev, [key]: value };
  let notice: string | null = null;

  if (key !== "material" && key !== "plot") {
    return { next, notice };
  }

  const originalPlot = String(context.editingRow?.plot ?? "");
  const originalMaterial = String(context.editingRow?.material ?? "");
  const plotChanged =
    key === "plot" && value !== originalPlot && originalPlot !== "";
  const materialChanged =
    key === "material" && value !== originalMaterial && originalMaterial !== "";

  const amount = resolveAmountFromSelections(next, context);
  if (amount != null) {
    next.amount = String(amount);
  }

  if (context.editingRow && (plotChanged || materialChanged)) {
    const parts: string[] = [];
    if (amount != null) {
      parts.push(
        `הכמות תעודכן אוטומטית לפי דונם החלקה וכמות לדונם של החומר (${amount})`,
      );
    }
    if (materialChanged) {
      const material = context.materials.find(
        (row) => String(row._id) === String(next.material ?? ""),
      );
      const unitPrice = Number(material?.customerCost ?? material?.currentBuyingCost ?? 0);
      if (Number.isFinite(unitPrice)) {
        parts.push(`מחיר לק״ג יעודכן לפי החומר החדש (${formatNumber(unitPrice)})`);
        if (amount != null) {
          parts.push(
            `המחיר הסופי יחושב מחדש (${formatNumber(Number((unitPrice * amount).toFixed(2)))})`,
          );
        }
      }
    } else if (amount != null) {
      const material = context.materials.find(
        (row) => String(row._id) === String(next.material ?? ""),
      );
      const unitPrice = Number(
        material?.customerCost ??
          material?.currentBuyingCost ??
          context.editingRow?.unitPrice ??
          0,
      );
      if (Number.isFinite(unitPrice)) {
        parts.push(
          `המחיר הסופי יחושב מחדש (${formatNumber(Number((unitPrice * amount).toFixed(2)))})`,
        );
      }
    }
    if (parts.length > 0) {
      notice = parts.join(". ");
    }
  }

  return { next, notice };
}

export function enrichMaterialUsagePayload(
  payload: Record<string, unknown>,
  values: Record<string, string>,
  context: MaterialUsageFormContext,
): Record<string, unknown> {
  if (payload.amount != null && payload.amount !== "") {
    return payload;
  }

  const amount = resolveAmountFromSelections(values, context);
  if (amount == null) {
    return payload;
  }

  return { ...payload, amount };
}
