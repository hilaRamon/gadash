import type { CollectionDocument } from "../../../schema/types";
import { calcMaterialUsageAmount } from "../../../lib/materialUsageAmount";
import { formatNumber } from "../../../lib/formatNumber";
import { numberToFormFieldValue } from "./helpers";

export type MaterialUsageLineEntry = {
  materialId: string;
  amount: string;
};

type MaterialUsageFormContext = {
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
};

export function calcMaterialUsageAmountForPlot(
  plotId: string,
  materialId: string,
  context: Pick<MaterialUsageFormContext, "materials" | "plots">,
): string {
  const normalizedPlotId = plotId.trim();
  const normalizedMaterialId = materialId.trim();
  if (!normalizedPlotId || !normalizedMaterialId) return "";

  const material = context.materials.find(
    (row) => String(row._id) === normalizedMaterialId,
  );
  const plot = context.plots.find(
    (row) => String(row._id) === normalizedPlotId,
  );
  if (!material || !plot) return "";

  const plotDunam = Number(plot.dunam);
  const amountPerDunam = Number(material.amountPerDunam);
  const amount = calcMaterialUsageAmount(
    plotDunam,
    Number.isFinite(amountPerDunam) ? amountPerDunam : null,
  );
  return amount == null ? "" : numberToFormFieldValue(amount);
}

export function toggleMaterialUsageLine(
  entries: MaterialUsageLineEntry[],
  materialId: string,
  checked: boolean,
  plotId: string,
  context: Pick<MaterialUsageFormContext, "materials" | "plots">,
): MaterialUsageLineEntry[] {
  if (!checked) {
    return entries.filter((entry) => entry.materialId !== materialId);
  }
  if (entries.some((entry) => entry.materialId === materialId)) {
    return entries;
  }
  return [
    ...entries,
    {
      materialId,
      amount: calcMaterialUsageAmountForPlot(plotId, materialId, context),
    },
  ];
}

export function updateMaterialUsageLine(
  entries: MaterialUsageLineEntry[],
  materialId: string,
  patch: Partial<Pick<MaterialUsageLineEntry, "materialId" | "amount">>,
  plotId: string,
  context: Pick<MaterialUsageFormContext, "materials" | "plots">,
): MaterialUsageLineEntry[] {
  return entries.map((entry) => {
    if (entry.materialId !== materialId) return entry;
    const nextMaterialId = patch.materialId ?? entry.materialId;
    const shouldRecalcAmount =
      patch.materialId != null && patch.materialId !== entry.materialId;
    return {
      materialId: nextMaterialId,
      amount: shouldRecalcAmount
        ? calcMaterialUsageAmountForPlot(plotId, nextMaterialId, context)
        : (patch.amount ?? entry.amount),
    };
  });
}

export function recalcMaterialUsageLineAmounts(
  entries: MaterialUsageLineEntry[],
  plotId: string,
  context: Pick<MaterialUsageFormContext, "materials" | "plots">,
  options?: { onlyEmpty?: boolean },
): MaterialUsageLineEntry[] {
  return entries.map((entry) => {
    if (options?.onlyEmpty && entry.amount.trim()) {
      return entry;
    }
    return {
      ...entry,
      amount: calcMaterialUsageAmountForPlot(plotId, entry.materialId, context),
    };
  });
}

export function getMaterialUsageMultiCreateErrors(
  entries: MaterialUsageLineEntry[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (entries.length === 0) {
    errors.materials = "יש לבחור לפחות חומר אחד";
    return errors;
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.materialId.trim()) {
      errors[entry.materialId || "unknown"] = "יש לבחור חומר";
      continue;
    }
    if (seen.has(entry.materialId)) {
      errors[entry.materialId] = "חומר כבר נבחר";
      continue;
    }
    seen.add(entry.materialId);
    if (!entry.amount.trim()) {
      errors[entry.materialId] = "יש להזין כמות";
      continue;
    }
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors[entry.materialId] = "כמות לא תקינה";
    }
  }

  return errors;
}

export function buildMaterialUsageCreatePayloads(
  basePayload: Record<string, unknown>,
  entries: MaterialUsageLineEntry[],
  values: Record<string, string>,
  context: MaterialUsageFormContext,
): Record<string, unknown>[] {
  return entries.map((entry) =>
    enrichMaterialUsagePayload(
      {
        ...basePayload,
        material: entry.materialId,
        amount: entry.amount === "" ? "" : Number(entry.amount),
      },
      { ...values, material: entry.materialId, amount: entry.amount },
      context,
    ),
  );
}

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
    next.amount = numberToFormFieldValue(amount);
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
