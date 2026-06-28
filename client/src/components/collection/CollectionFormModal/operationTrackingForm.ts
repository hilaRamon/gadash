import type { CollectionDocument, FormFieldDef } from "../../../schema/types";
import { formatNumber } from "../../../lib/formatNumber";
import { numberToFormFieldValue } from "./helpers";
import {
  OPERATION_PRICING_BY_DUNAM,
  OPERATION_PRICING_BY_UNIT,
  OPERATION_PRICING_HOURLY,
  calcFinalPrice,
  resolveOperationAmount,
  suggestOperationAmount,
} from "../../../lib/operationTrackingPricing";

export type OperationTrackingLineEntry = {
  operationId: string;
  amount: string;
};

type OperationTrackingFormContext = {
  operations: CollectionDocument[];
  plots: CollectionDocument[];
  editingRow: CollectionDocument | null;
};

type OperationAmountContext = Pick<
  OperationTrackingFormContext,
  "operations" | "plots"
> & {
  plotId: string;
  startTime: string;
  endTime: string;
};

function findOperation(
  operations: CollectionDocument[],
  operationId: string,
): CollectionDocument | undefined {
  return operations.find((row) => String(row._id) === String(operationId));
}

function findPlot(
  plots: CollectionDocument[],
  plotId: string,
): CollectionDocument | undefined {
  return plots.find((row) => String(row._id) === String(plotId));
}

export function calcOperationTrackingAmountForLine(
  operationId: string,
  context: OperationAmountContext,
): string {
  const normalizedOperationId = operationId.trim();
  if (!normalizedOperationId) return "";

  const operation = findOperation(context.operations, normalizedOperationId);
  if (!operation) return "";

  const plot = context.plotId
    ? findPlot(context.plots, context.plotId)
    : undefined;
  const pricingForm = String(operation.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  const suggested = suggestOperationAmount(pricingForm, {
    startTime: context.startTime,
    endTime: context.endTime,
    plotDunam: plot ? Number(plot.dunam ?? 0) : null,
  });

  return suggested == null ? "" : numberToFormFieldValue(suggested);
}

export function toggleOperationTrackingLine(
  entries: OperationTrackingLineEntry[],
  operationId: string,
  checked: boolean,
  context: OperationAmountContext,
): OperationTrackingLineEntry[] {
  if (!checked) {
    return entries.filter((entry) => entry.operationId !== operationId);
  }
  if (entries.some((entry) => entry.operationId === operationId)) {
    return entries;
  }
  return [
    ...entries,
    {
      operationId,
      amount: calcOperationTrackingAmountForLine(operationId, context),
    },
  ];
}

export function updateOperationTrackingLine(
  entries: OperationTrackingLineEntry[],
  operationId: string,
  patch: Partial<Pick<OperationTrackingLineEntry, "operationId" | "amount">>,
  context: OperationAmountContext,
): OperationTrackingLineEntry[] {
  return entries.map((entry) => {
    if (entry.operationId !== operationId) return entry;
    const nextOperationId = patch.operationId ?? entry.operationId;
    const shouldRecalcAmount =
      patch.operationId != null && patch.operationId !== entry.operationId;
    return {
      operationId: nextOperationId,
      amount: shouldRecalcAmount
        ? calcOperationTrackingAmountForLine(nextOperationId, context)
        : (patch.amount ?? entry.amount),
    };
  });
}

export function recalcOperationTrackingLineAmounts(
  entries: OperationTrackingLineEntry[],
  context: OperationAmountContext,
  options?: { onlyEmpty?: boolean },
): OperationTrackingLineEntry[] {
  return entries.map((entry) => {
    if (options?.onlyEmpty && entry.amount.trim()) {
      return entry;
    }
    return {
      ...entry,
      amount: calcOperationTrackingAmountForLine(entry.operationId, context),
    };
  });
}

export function getOperationTrackingMultiCreateErrors(
  entries: OperationTrackingLineEntry[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (entries.length === 0) {
    errors.operations = "יש לבחור לפחות פעולה אחת";
    return errors;
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.operationId.trim()) {
      errors[entry.operationId || "unknown"] = "יש לבחור פעולה";
      continue;
    }
    if (seen.has(entry.operationId)) {
      errors[entry.operationId] = "פעולה כבר נבחרה";
      continue;
    }
    seen.add(entry.operationId);
    if (!entry.amount.trim()) {
      errors[entry.operationId] = "יש להזין כמות";
      continue;
    }
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors[entry.operationId] = "כמות לא תקינה";
    }
  }

  return errors;
}

export function buildOperationTrackingCreatePayloads(
  basePayload: Record<string, unknown>,
  entries: OperationTrackingLineEntry[],
  values: Record<string, string>,
  context: OperationTrackingFormContext,
): Record<string, unknown>[] {
  return entries.map((entry) =>
    enrichOperationTrackingPayload(
      {
        ...basePayload,
        operation: entry.operationId,
        amount: entry.amount === "" ? "" : Number(entry.amount),
      },
      { ...values, operation: entry.operationId, amount: entry.amount },
      context.operations,
      context.plots,
    ),
  );
}

function resolvePricingFromSelections(
  values: Record<string, string>,
  context: OperationTrackingFormContext,
): { unitCost: number; amount: number; finalPrice: number } | null {
  const operation = findOperation(context.operations, values.operation ?? "");
  if (!operation) return null;

  const plot = findPlot(context.plots, values.plot ?? "");
  const pricingForm = String(operation.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  const unitCost = Number(operation.currentCost ?? 0);
  const amount = resolveOperationAmount(pricingForm, {
    startTime: values.startTime,
    endTime: values.endTime,
    amount: values.amount,
    plotDunam: plot ? Number(plot.dunam ?? 0) : null,
  });

  if (!Number.isFinite(unitCost) || amount == null || !Number.isFinite(amount)) {
    return null;
  }

  return {
    unitCost,
    amount,
    finalPrice: calcFinalPrice(unitCost, amount),
  };
}

function suggestAmountValue(
  values: Record<string, string>,
  context: OperationTrackingFormContext,
): string | null {
  const operation = findOperation(context.operations, values.operation ?? "");
  if (!operation) return null;

  const plot = findPlot(context.plots, values.plot ?? "");
  const pricingForm = String(operation.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  const suggested = suggestOperationAmount(pricingForm, {
    startTime: values.startTime,
    endTime: values.endTime,
    plotDunam: plot ? Number(plot.dunam ?? 0) : null,
  });

  return suggested == null ? null : numberToFormFieldValue(suggested);
}

export function applyOperationTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  context: OperationTrackingFormContext,
): { next: Record<string, string>; notice: string | null } {
  const next = { ...prev, [key]: value };
  const operation = findOperation(context.operations, next.operation ?? "");
  const pricingForm = String(operation?.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  const parts: string[] = [];

  if (
    key === "operation" ||
    key === "plot" ||
    key === "startTime" ||
    key === "endTime"
  ) {
    if (key === "operation" && pricingForm === OPERATION_PRICING_BY_UNIT) {
      next.amount = "";
    }

    const suggested = suggestAmountValue(next, context);
    if (suggested != null) {
      next.amount = suggested;
    }

    if (key === "operation") {
      const unitCost = Number(operation?.currentCost ?? 0);
      if (Number.isFinite(unitCost)) {
        parts.push(`מחיר ליחידה יעודכן לפי הפעולה החדשה (${formatNumber(unitCost)})`);
      }
    }

    if (key === "plot") {
      const plot = findPlot(context.plots, value);
      const plotDunam = Number(plot?.dunam ?? 0);
      if (pricingForm === OPERATION_PRICING_BY_DUNAM && Number.isFinite(plotDunam)) {
        parts.push(`כמות תעודכן לפי החלקה החדשה (${formatNumber(plotDunam)})`);
      }
    }

    if (
      (key === "startTime" || key === "endTime") &&
      pricingForm === OPERATION_PRICING_HOURLY &&
      suggested != null
    ) {
      parts.push(`כמות תעודכן לפי השעות (${formatNumber(Number(suggested))})`);
    }

    const pricing = resolvePricingFromSelections(next, context);
    if (pricing) {
      parts.push(`המחיר הסופי יחושב מחדש (${formatNumber(pricing.finalPrice)})`);
    }
  }

  if (context.editingRow && (key === "operation" || key === "plot")) {
    const originalPlot = String(context.editingRow.plot ?? "");
    const originalOperation = String(context.editingRow.operation ?? "");
    const plotChanged =
      key === "plot" && value !== originalPlot && originalPlot !== "";
    const operationChanged =
      key === "operation" &&
      value !== originalOperation &&
      originalOperation !== "";

    if (!plotChanged && !operationChanged && parts.length === 0) {
      return { next, notice: null };
    }
  }

  return { next, notice: parts.length > 0 ? parts.join(". ") : null };
}

export function getOperationTrackingRequiredErrors(
  visibleFields: FormFieldDef[],
  values: Record<string, string>,
  operations: CollectionDocument[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const operation = findOperation(operations, values.operation ?? "");
  const pricingForm = String(operation?.pricingForm ?? OPERATION_PRICING_BY_DUNAM);

  for (const field of visibleFields) {
    const val = values[field.key] ?? "";
    if (field.required && !String(val).trim()) {
      errors[field.key] = "שדה חובה";
    }
  }

  if (pricingForm === OPERATION_PRICING_BY_UNIT && !String(values.amount ?? "").trim()) {
    errors.amount = "שדה חובה";
  }

  return errors;
}

export function enrichOperationTrackingPayload(
  payload: Record<string, unknown>,
  values: Record<string, string>,
  operations: CollectionDocument[],
  plots: CollectionDocument[],
): Record<string, unknown> {
  const operation = findOperation(operations, String(payload.operation ?? ""));
  const plot = findPlot(plots, String(payload.plot ?? ""));
  const pricingForm = String(operation?.pricingForm ?? OPERATION_PRICING_BY_DUNAM);
  const explicitAmount = String(values.amount ?? "").trim();

  const amount =
    explicitAmount !== ""
      ? Number(explicitAmount)
      : resolveOperationAmount(pricingForm, {
          startTime: String(values.startTime ?? ""),
          endTime: String(values.endTime ?? ""),
          amount: null,
          plotDunam: plot ? Number(plot.dunam ?? 0) : null,
        });

  return {
    ...payload,
    amount: amount == null || !Number.isFinite(amount) ? null : amount,
  };
}
