import type { FormFieldDef } from "../../../schema/types";
import {
  calcFinalPrice,
  calcHoursBetween,
  resolveUnitAmount,
} from "../../../lib/contractorTrackingPricing";
import { HOUR_INVALID_ERROR, isValidHour } from "./helpers";

const HOURLY_PRICING = "שעתי";

export function isHourlyPricing(pricingForm: string): boolean {
  return pricingForm === HOURLY_PRICING;
}

export function getContractorTrackingVisibleFields(
  fields: FormFieldDef[],
  values: Record<string, string>,
): FormFieldDef[] {
  const hourly = isHourlyPricing(values.pricingForm ?? "");

  return fields.filter((field) => {
    if (field.key === "startTime" || field.key === "endTime") {
      return hourly;
    }
    if (field.key === "unitAmount") {
      return !hourly;
    }
    return true;
  });
}

export function applyContractorTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
): Record<string, string> {
  const next = { ...prev, [key]: value };

  if (key === "pricingForm" && !isHourlyPricing(value)) {
    next.startTime = "";
    next.endTime = "";
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

  return next;
}

export function getContractorTrackingRequiredErrors(
  visibleFields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const hourly = isHourlyPricing(values.pricingForm ?? "");

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
  } else if (!String(values.unitAmount ?? "").trim()) {
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
    unitAmount: values.unitAmount,
  });
  const unitPrice = Number(payload.unitPrice);

  return {
    ...payload,
    startTime: hourly ? payload.startTime : null,
    endTime: hourly ? payload.endTime : null,
    unitAmount: unitAmount ?? "",
    finalPrice: calcFinalPrice(unitPrice, unitAmount ?? 0),
    customerPrice:
      payload.customerPrice === "" || payload.customerPrice == null
        ? null
        : payload.customerPrice,
  };
}
