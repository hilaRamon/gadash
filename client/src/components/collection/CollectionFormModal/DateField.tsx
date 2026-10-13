import styled from "styled-components";
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
      type="date"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    />
  );
}
