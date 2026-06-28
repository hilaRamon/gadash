import { PhoneField } from "../PhoneField";
import { ReferenceFieldSelect } from "../ReferenceFieldSelect";
import { HourField } from "./HourField";
import type { FormFieldDef } from "../../../schema/types";
import styled from "styled-components";
import { fieldControlStyles } from "./sharedStyles";

type FormFieldControlProps = {
  field: FormFieldDef;
  value: string;
  setFieldValue: (key: string, value: string) => void;
  disabled?: boolean;
  booleanLabels?: {
    trueLabel: string;
    falseLabel: string;
  };
};

const Input = styled.input`
  ${fieldControlStyles}
`;

const Select = styled.select`
  ${fieldControlStyles}
`;

const TextArea = styled.textarea`
  ${fieldControlStyles}
  min-height: 5rem;
  resize: vertical;
`;

export function FormFieldControl({
  field,
  value,
  setFieldValue,
  disabled = false,
  booleanLabels,
}: FormFieldControlProps) {
  if (field.type === "textarea") {
    return (
      <TextArea
        id={`field-${field.key}`}
        value={value}
        onChange={(e) => setFieldValue(field.key, e.target.value)}
        required={field.required}
      />
    );
  }

  if (field.type === "reference" && field.referenceCollection) {
    return (
      <ReferenceFieldSelect
        collection={field.referenceCollection}
        value={value}
        required={field.required}
        filterOption={field.referenceFilter}
        onChange={(nextValue) => setFieldValue(field.key, nextValue)}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <Select
        id={`field-${field.key}`}
        value={value || "true"}
        disabled={disabled}
        onChange={(e) => setFieldValue(field.key, e.target.value)}
      >
        <option value="true">{booleanLabels?.trueLabel ?? "כן"}</option>
        <option value="false">{booleanLabels?.falseLabel ?? "לא"}</option>
      </Select>
    );
  }

  if (field.type === "select" || field.type === "enum") {
    return (
      <Select
        id={`field-${field.key}`}
        value={value}
        onChange={(e) => setFieldValue(field.key, e.target.value)}
        required={field.required}
      >
        <option value="">ללא</option>
        {field.enumOptions?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "phone") {
    return (
      <PhoneField
        id={`field-${field.key}`}
        value={value}
        required={field.required}
        onChange={(nextValue) => setFieldValue(field.key, nextValue)}
      />
    );
  }

  if (field.type === "time") {
    return (
      <HourField
        id={`field-${field.key}`}
        value={value}
        required={field.required}
        onChange={(nextValue) => setFieldValue(field.key, nextValue)}
      />
    );
  }

  return (
    <Input
      id={`field-${field.key}`}
      type={
        field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : "text"
      }
      dir={field.type === "number" ? "ltr" : undefined}
      value={field.type === "number" ? (value !== "0" ? value : "") : value}
      disabled={disabled}
      onChange={(e) => setFieldValue(field.key, e.target.value)}
      required={field.required}
    />
  );
}
