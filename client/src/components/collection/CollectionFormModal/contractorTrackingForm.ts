import type { CollectionDocument, FormFieldDef } from "../../../schema/types";
import {
  calcHoursBetween,
  getContractorUnitAmountLabel,
  getContractorUnitCustomerPriceLabel,
  getContractorUnitPriceLabel,
  isDailyPricing,
  isDunamPricing,
  isHourlyPricing,
  resolveUnitAmount,
} from "../../../lib/contractorTrackingPricing";
import { HOUR_INVALID_ERROR, isValidHour, numberToFormFieldValue } from "./helpers";

export { isHourlyPricing } from "../../../lib/contractorTrackingPricing";

type ContractorTrackingFieldChangeContext = {
  plots: CollectionDocument[];
  onlyIfEmptyUnitAmount?: boolean;
};

function plotDunamFormValue(
  plotId: string,
  plots: CollectionDocument[],
): string | null {
  const plot = plots.find((row) => String(row._id) === String(plotId));
  if (!plot) return null;
  const dunam = Number(plot.dunam ?? 0);
  if (!Number.isFinite(dunam)) return null;
  return numberToFormFieldValue(dunam);
}

function applyPlotDunamUnitAmount(
  next: Record<string, string>,
  plots: CollectionDocument[],
  options?: { onlyIfEmpty?: boolean },
): Record<string, string> {
  if (!isDunamPricing(next.pricingForm ?? "")) return next;
  if (options?.onlyIfEmpty && String(next.unitAmount ?? "").trim()) return next;

  const plotId = String(next.plot ?? "").trim();
  if (!plotId) return next;

  const dunam = plotDunamFormValue(plotId, plots);
  if (dunam == null || dunam === "") return next;

  return { ...next, unitAmount: dunam };
}

export function getContractorTrackingVisibleFields(
  fields: FormFieldDef[],
  values: Record<string, string>,
): FormFieldDef[] {
  const pricingForm = values.pricingForm ?? "";
  const hourly = isHourlyPricing(pricingForm);
  const daily = isDailyPricing(pricingForm);

  return fields
    .filter((field) => {
      if (field.key === "startTime" || field.key === "endTime") {
        return hourly;
      }
      if (field.key === "unitAmount") {
        return !hourly && !daily;
      }
      return true;
    })
    .map((field) => {
      if (field.key === "unitPrice") {
        return { ...field, label: getContractorUnitPriceLabel(pricingForm) };
      }
      if (field.key === "unitAmount") {
        return { ...field, label: getContractorUnitAmountLabel(pricingForm) };
      }
      if (field.key === "unitCustomerPrice") {
        return { ...field, label: getContractorUnitCustomerPriceLabel(pricingForm) };
      }
      return field;
    });
}

export function applyContractorTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  context?: ContractorTrackingFieldChangeContext,
): Record<string, string> {
  const plots = context?.plots ?? [];
  const next = { ...prev, [key]: value };

  if (key === "pricingForm") {
    if (!isHourlyPricing(value)) {
      next.startTime = "";
      next.endTime = "";
    }
    if (isDailyPricing(value)) {
      next.unitAmount = "1";
    } else if (isDunamPricing(value)) {
      return applyPlotDunamUnitAmount(next, plots, {
        onlyIfEmpty: context?.onlyIfEmptyUnitAmount,
      });
    }
  }

  if (
    isHourlyPricing(next.pricingForm ?? "") &&
    (key === "startTime" || key === "endTime" || key === "pricingForm")
  ) {
    const hours = calcHoursBetween(next.startTime ?? "", next.endTime ?? "");
    if (hours != null) {
      next.unitAmount = String(hours);
    }
  }

  if (key === "plot") {
    return applyPlotDunamUnitAmount(next, plots);
  }

  return next;
}

export function getContractorTrackingRequiredErrors(
  visibleFields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const pricingForm = values.pricingForm ?? "";
  const hourly = isHourlyPricing(pricingForm);
  const daily = isDailyPricing(pricingForm);

  for (const field of visibleFields) {
    const val = values[field.key] ?? "";

    if (field.required && !String(val).trim()) {
      errors[field.key] = "שדה חובה";
      continue;
    }

    if (field.type === "time") {
      const trimmed = String(val).trim();
      if (hourly && !trimmed) {
        errors[field.key] = "שדה חובה";
      } else if (trimmed && !isValidHour(trimmed)) {
        errors[field.key] = HOUR_INVALID_ERROR;
      }
    }
  }

  if (hourly) {
    const hours = calcHoursBetween(values.startTime ?? "", values.endTime ?? "");
    if (hours == null && !errors.startTime && !errors.endTime) {
      errors.endTime = "שעת סיום חייבת להיות אחרי שעת התחלה";
    }
  } else if (!daily && !String(values.unitAmount ?? "").trim()) {
    errors.unitAmount = "שדה חובה";
  }

  if (!String(values.unitPrice ?? "").trim()) {
    errors.unitPrice = "שדה חובה";
  }

  return errors;
}

export function enrichContractorTrackingPayload(
  payload: Record<string, unknown>,
  values: Record<string, string>,
): Record<string, unknown> {
  const pricingForm = String(payload.pricingForm ?? "");
  const hourly = isHourlyPricing(pricingForm);
  const unitAmount = resolveUnitAmount(pricingForm, {
    startTime: values.startTime,
    endTime: values.endTime,
    unitAmount: isDailyPricing(pricingForm) ? "1" : values.unitAmount,
  });

  return {
    ...payload,
    startTime: hourly ? payload.startTime : null,
    endTime: hourly ? payload.endTime : null,
    unitAmount: unitAmount ?? (isDailyPricing(pricingForm) ? 1 : ""),
    unitCustomerPrice:
      payload.unitCustomerPrice === "" || payload.unitCustomerPrice == null
        ? null
        : payload.unitCustomerPrice,
  };
}
