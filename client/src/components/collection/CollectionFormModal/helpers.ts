import type { FormFieldDef, CollectionDocument } from "../../../schema/types";
import {
  formatMobileDisplay,
  MOBILE_INVALID_ERROR,
  normalizeMobile,
} from "../../../lib/mobileFormat";

export const HOUR_INVALID_ERROR = "שעה לא תקינה";

export function isValidHour(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeHourDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const shortMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!shortMatch) return trimmed;

  const hours = shortMatch[1].padStart(2, "0");
  return `${hours}:${shortMatch[2]}`;
}

export function getInitialValues(
  fields: FormFieldDef[],
  row: CollectionDocument | null,
): Record<string, string> {
  const values: Record<string, string> = {};
  const today = new Date().toISOString().slice(0, 10);

  for (const field of fields) {
    const raw = row?.[field.key];

    if (field.hidden && field.key === "billable") {
      values[field.key] = "false";
      continue;
    }

    if (field.hidden && field.defaultValue === null) {
      values[field.key] = "";
      continue;
    }

    if (field.type === "boolean") {
      if (raw == null || raw === "") {
        values[field.key] = row ? "false" : "true";
      } else {
        values[field.key] = raw === true || raw === "true" ? "true" : "false";
      }
      continue;
    }

    if (field.type === "enum") {
      values[field.key] = raw == null || raw === "" ? "" : String(raw);
      continue;
    }

    if (field.type === "phone") {
      values[field.key] =
        raw == null || raw === "" ? "" : formatMobileDisplay(String(raw));
      continue;
    }

    if (field.type === "time") {
      values[field.key] =
        raw == null || raw === "" ? "" : normalizeHourDisplay(String(raw));
      continue;
    }

    if (field.type === "date") {
      if (raw == null || raw === "") {
        values[field.key] = row ? "" : today;
      } else {
        values[field.key] = String(raw).slice(0, 10);
      }
      continue;
    }

    if (field.type === "number" && field.defaultValue === null) {
      values[field.key] =
        raw == null || raw === "" ? "" : String(raw);
      continue;
    }

    values[field.key] = raw == null ? "" : String(raw);
  }

  return values;
}

export function buildPayload(
  fields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, unknown> | { error: string } | null {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const val = values[field.key] ?? "";

    if (field.hidden && field.key === "billable") {
      payload[field.key] = false;
      continue;
    }

    if (field.hidden && field.defaultValue === null) {
      payload[field.key] = null;
      continue;
    }

    if (field.required && !String(val).trim()) {
      return null;
    }

    if (field.type === "boolean") {
      payload[field.key] = val === "true";
      continue;
    }

    if (field.type === "reference" && !field.required && !String(val).trim()) {
      payload[field.key] = null;
      continue;
    }

    if (field.type === "number") {
      payload[field.key] = val === "" ? "" : Number(val);
      continue;
    }

    if (field.type === "enum") {
      payload[field.key] = val === "" ? null : val;
      continue;
    }

    if (field.type === "phone") {
      const trimmed = String(val).trim();
      if (!trimmed) {
        payload[field.key] = "";
      } else {
        try {
          payload[field.key] = normalizeMobile(trimmed);
        } catch {
          return { error: MOBILE_INVALID_ERROR };
        }
      }
      continue;
    }

    if (field.type === "time") {
      const trimmed = String(val).trim();
      if (!trimmed) {
        payload[field.key] = "";
      } else if (!isValidHour(trimmed)) {
        return { error: HOUR_INVALID_ERROR };
      } else {
        payload[field.key] = trimmed;
      }
      continue;
    }

    payload[field.key] = val;
  }

  return payload;
}

export function getRequiredFieldErrors(
  fields: FormFieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const val = values[field.key] ?? "";
    if (field.required && !String(val).trim()) {
      errors[field.key] = "שדה חובה";
      continue;
    }

    if (field.type === "time") {
      const trimmed = String(val).trim();
      if (trimmed && !isValidHour(trimmed)) {
        errors[field.key] = HOUR_INVALID_ERROR;
      }
    }
  }

  return errors;
}
