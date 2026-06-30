import styled from "styled-components";
import { formatDateInput } from "../../../lib/dateFieldFormat";
import { fieldControlStyles } from "./sharedStyles";

type DateFieldProps = {
  id: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const Input = styled.input`
  ${fieldControlStyles}
`;

export function DateField({
  id,
  value,
  required,
  disabled = false,
  onChange,
}: DateFieldProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/yy"
      dir="ltr"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(formatDateInput(e.target.value))}
      required={required}
    />
  );
}
