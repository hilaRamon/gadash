import type { FormFieldDef } from "@/schema/types";
import type { CollectionDocument } from "@/schema/types";
import {
  calcFinalPrice,
  calcHoursBetween,
} from "@/lib/transportTrackingPricing";
import { TRANSPORT_CUSTOMER_BILLING } from "@/lib/transportBilling";
import { HOUR_INVALID_ERROR, isValidHour } from "./helpers";

export function getTransportTrackingVisibleFields(
  fields: FormFieldDef[],
  values: Record<string, string>,
): FormFieldDef[] {
  const showCustomer = values.billing === TRANSPORT_CUSTOMER_BILLING;

  return fields
    .filter((field) => {
      if (field.key === "customer" || field.key === "customerHourlyRate") {
        return showCustomer;
      }
      return true;
    })
    .map((field) => {
      if (field.key === "customer" || field.key === "customerHourlyRate") {
        return { ...field, required: true };
      }
      return field;
    });
}

export function applyTransportTrackingFieldChange(
  key: string,
  value: string,
  prev: Record<string, string>,
  movers: CollectionDocument[],
): Record<string, string> {
  const next = { ...prev, [key]: value };

  if (key === "billing") {
    if (value !== TRANSPORT_CUSTOMER_BILLING) {
      next.customer = "";
      next.customerHourlyRate = next.hourlyRate ?? "";
    } else if (!String(next.customerHourlyRate ?? "").trim()) {
      next.customerHourlyRate = next.hourlyRate ?? "";
    }
  }

  if (key === "mover" && value) {
    const mover = movers.find((m) => String(m._id) === value);
    if (mover != null) {
      next.hourlyRate = String(mover.hourlyRate ?? "");
    }
  }

  if (key === "mover" || key === "hourlyRate") {
    const customerBilling = next.billing === TRANSPORT_CUSTOMER_BILLING;
    const customerRateEmpty = !String(next.customerHourlyRate ?? "").trim();
    if (!customerBilling || customerRateEmpty) {
      next.customerHourlyRate = next.hourlyRate ?? "";
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

  if (
    values.billing === TRANSPORT_CUSTOMER_BILLING &&
    !String(values.customer ?? "").trim()
  ) {
    errors.customer = "שדה חובה";
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
  const customerBilling = values.billing === TRANSPORT_CUSTOMER_BILLING;
  const rawCustomerRate = payload.customerHourlyRate;
  const parsedCustomerRate =
    rawCustomerRate == null || rawCustomerRate === ""
      ? Number.NaN
      : Number(rawCustomerRate);
  const customerHourlyRate =
    customerBilling && Number.isFinite(parsedCustomerRate)
      ? parsedCustomerRate
      : hourlyRate;

  return {
    ...payload,
    hours,
    hourlyRate,
    customerHourlyRate,
    finalPrice: calcFinalPrice(hourlyRate, hours),
    customer: customerBilling ? payload.customer : null,
  };
}
