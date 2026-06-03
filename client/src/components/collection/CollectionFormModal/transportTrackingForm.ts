import type { FormFieldDef } from "../../../schema/types";
import type { CollectionDocument } from "../../../schema/types";
import {
  calcFinalPrice,
  calcHoursBetween,
} from "../../../lib/transportTrackingPricing";
import { HOUR_INVALID_ERROR, isValidHour } from "./helpers";

export function applyTransportTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  movers: CollectionDocument[],
): Record<string, string> {
  const next = { ...prev, [key]: value };

  if (key === "mover" && value) {
    const mover = movers.find((m) => String(m._id) === value);
    if (mover != null) {
      next.hourlyRate = String(mover.hourlyRate ?? "");
    }
  }

  if (
    key === "mover" ||
    key === "startTime" ||
    key === "endTime" ||
    key === "hourlyRate"
  ) {
    const hours = calcHoursBetween(next.startTime ?? "", next.endTime ?? "");
    if (hours != null) {
      next.hours = String(hours);
      const rate = Number(next.hourlyRate);
      if (Number.isFinite(rate)) {
        next.finalPrice = String(calcFinalPrice(rate, hours));
      }
    } else {
      next.hours = "";
      next.finalPrice = "";
    }
  }

  return next;
}

export function getTransportTrackingRequiredErrors(
  visibleFields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of visibleFields) {
    const val = values[field.key] ?? "";

    if (field.required && !String(val).trim()) {
      errors[field.key] = "שדה חובה";
      continue;
    }

    if (field.type === "time") {
      const trimmed = String(val).trim();
      if (!trimmed) {
        errors[field.key] = "שדה חובה";
      } else if (!isValidHour(trimmed)) {
        errors[field.key] = HOUR_INVALID_ERROR;
      }
    }
  }

  const hours = calcHoursBetween(values.startTime ?? "", values.endTime ?? "");
  if (hours == null && !errors.startTime && !errors.endTime) {
    errors.endTime = "שעת סיום חייבת להיות אחרי שעת התחלה";
  }

  if (!String(values.hourlyRate ?? "").trim()) {
    errors.hourlyRate = "שדה חובה";
  }

  return errors;
}

export function enrichTransportTrackingPayload(
  payload: Record<string, unknown>,
  values: Record<string, string>,
): Record<string, unknown> {
  const hours =
    calcHoursBetween(values.startTime ?? "", values.endTime ?? "") ?? 0;
  const hourlyRate = Number(payload.hourlyRate);

  return {
    ...payload,
    hours,
    finalPrice: calcFinalPrice(hourlyRate, hours),
  };
}
