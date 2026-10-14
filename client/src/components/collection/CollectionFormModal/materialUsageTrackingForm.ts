import type { CollectionDocument } from "@/schema/types";
import { calcMaterialUsageAmount } from "@/lib/materialUsageAmount";
import { formatNumber } from "@/lib/formatNumber";
import { numberToFormFieldValue } from "./helpers";

export type MaterialUsageLineEntry = {
  materialId: string;
  amount: string;
  unitPrice: string;
};

type MaterialUsageFormContext = {
  materials: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
};

function findMaterial(
  materials: CollectionDocument[],
  materialId: string,
): CollectionDocument | undefined {
  return materials.find((row) => String(row._id) === String(materialId));
}

function materialUnitPriceFormValue(
  material: CollectionDocument | undefined,
): string {
  if (!material) return "";
  const unitPrice = Number(material.customerCost ?? 0);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return "";
  return String(unitPrice);
}

function resolveFormUnitPrice(
  values: Record<string, string>,
  context: MaterialUsageFormContext,
): number | null {
  const explicitUnitPrice = String(values.unitPrice ?? "").trim();
  if (explicitUnitPrice !== "") {
    const parsed = Number(explicitUnitPrice);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const fallback = Number(
    findMaterial(context.materials, values.material ?? "")?.customerCost ?? 0,
  );
  return Number.isFinite(fallback) ? fallback : null;
}

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
      unitPrice: materialUnitPriceFormValue(
        findMaterial(context.materials, materialId),
      ),
    },
  ];
}

export function updateMaterialUsageLine(
  entries: MaterialUsageLineEntry[],
  materialId: string,
  patch: Partial<
    Pick<MaterialUsageLineEntry, "materialId" | "amount" | "unitPrice">
  >,
  plotId: string,
  context: Pick<MaterialUsageFormContext, "materials" | "plots">,
): MaterialUsageLineEntry[] {
  return entries.map((entry) => {
    if (entry.materialId !== materialId) return entry;
    const nextMaterialId = patch.materialId ?? entry.materialId;
    const materialChanged =
      patch.materialId != null && patch.materialId !== entry.materialId;
    return {
      materialId: nextMaterialId,
      amount: materialChanged
        ? calcMaterialUsageAmountForPlot(plotId, nextMaterialId, context)
        : (patch.amount ?? entry.amount),
      unitPrice: materialChanged
        ? materialUnitPriceFormValue(
            findMaterial(context.materials, nextMaterialId),
          )
        : (patch.unitPrice ?? entry.unitPrice),
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
      continue;
    }
    if (!entry.unitPrice.trim()) {
      errors[entry.materialId] = "יש להזין מחיר לק״ג";
      continue;
    }
    const unitPrice = Number(entry.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors[entry.materialId] = "מחיר לק״ג לא תקין";
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
        unitPrice: entry.unitPrice === "" ? "" : Number(entry.unitPrice),
      },
      {
        ...values,
        material: entry.materialId,
        amount: entry.amount,
        unitPrice: entry.unitPrice,
      },
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

function finalPriceNotice(unitPrice: number, amountRaw: string): string | null {
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) return null;
  return `המחיר הסופי יחושב מחדש (${formatNumber(Number((unitPrice * amount).toFixed(2)))})`;
}

export function getMaterialUsageEditErrors(
  values: Record<string, string>,
): Record<string, string> {
  const raw = String(values.unitPrice ?? "").trim();
  if (!raw) return {};
  const unitPrice = Number(raw);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { unitPrice: "מחיר לק״ג לא תקין" };
  }
  return {};
}

export function applyMaterialUsageFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  context: MaterialUsageFormContext,
): { next: Record<string, string>; notice: string | null } {
  const next = { ...prev, [key]: value };
  const parts: string[] = [];

  if (key !== "material" && key !== "plot" && key !== "unitPrice") {
    return { next, notice: null };
  }

  if (key === "material" || key === "plot") {
    const amount = resolveAmountFromSelections(next, context);
    if (amount != null) {
      next.amount = numberToFormFieldValue(amount);
    }
  }

  if (key === "material" && value !== prev.material) {
    const unitPrice = materialUnitPriceFormValue(
      findMaterial(context.materials, value),
    );
    if (unitPrice !== "") {
      next.unitPrice = unitPrice;
    }
  }

  const originalPlot = String(context.editingRow?.plot ?? "");
  const originalMaterial = String(context.editingRow?.material ?? "");
  const plotChanged =
    key === "plot" && value !== originalPlot && originalPlot !== "";
  const materialChanged =
    key === "material" && value !== originalMaterial && originalMaterial !== "";

  if (context.editingRow && (plotChanged || materialChanged)) {
    if (next.amount.trim()) {
      parts.push(
        `הכמות תעודכן אוטומטית לפי דונם החלקה וכמות לדונם של החומר (${next.amount})`,
      );
    }
    if (materialChanged && next.unitPrice.trim()) {
      parts.push(
        `מחיר לק״ג יעודכן לפי החומר החדש (${formatNumber(Number(next.unitPrice))})`,
      );
    }
  }

  const shouldPriceNotice =
    key === "unitPrice" ||
    (context.editingRow != null && (plotChanged || materialChanged));
  if (shouldPriceNotice) {
    const unitPrice = resolveFormUnitPrice(next, context);
    if (unitPrice != null) {
      const priceNotice = finalPriceNotice(unitPrice, next.amount);
      if (priceNotice) parts.push(priceNotice);
    }
  }

  return { next, notice: parts.length > 0 ? parts.join(". ") : null };
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
