import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  buildMonthValue,
  parseMonthValue,
  yearOptions,
} from "@/api/monthlyReportApi";

type NumericMonthPickerProps = {
  id?: string;
  value: string;
  onChange: (month: string) => void;
  allowEmpty?: boolean;
  yearRange?: number;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function NumericMonthPicker({
  id,
  value,
  onChange,
  allowEmpty = false,
  yearRange,
}: NumericMonthPickerProps) {
  const parsed = parseMonthValue(value);
  const selectedYear = Number.isInteger(parsed.year) ? parsed.year : null;
  const selectedMonth =
    Number.isInteger(parsed.month) && parsed.month >= 1 && parsed.month <= 12
      ? parsed.month
      : null;
  const [draftYear, setDraftYear] = useState(
    () => selectedYear ?? new Date().getFullYear(),
  );

  useEffect(() => {
    if (selectedYear != null) setDraftYear(selectedYear);
  }, [selectedYear]);

  const year = selectedYear ?? draftYear;
  const years = useMemo(() => {
    const options = yearOptions(yearRange);
    if (!options.includes(year)) {
      return [...options, year].sort((a, b) => a - b);
    }
    return options;
  }, [year, yearRange]);

  return (
    <PickerRow id={id}>
      <MonthSelect
        aria-label="חודש"
        value={selectedMonth ?? ""}
        onChange={(event) => {
          const nextMonth = Number(event.target.value);
          if (!nextMonth) {
            onChange("");
            return;
          }
          onChange(buildMonthValue(year, nextMonth));
        }}
      >
        {allowEmpty ? <option value="">—</option> : null}
        {MONTH_OPTIONS.map((monthOption) => (
          <option key={monthOption} value={monthOption}>
            {monthOption}
          </option>
        ))}
      </MonthSelect>
      <YearSelect
        aria-label="שנה"
        value={year}
        onChange={(event) => {
          const nextYear = Number(event.target.value);
          if (selectedMonth) {
            onChange(buildMonthValue(nextYear, selectedMonth));
            return;
          }
          setDraftYear(nextYear);
        }}
      >
        {years.map((yearOption) => (
          <option key={yearOption} value={yearOption}>
            {yearOption}
          </option>
        ))}
      </YearSelect>
    </PickerRow>
  );
}

const PickerRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SelectBase = styled.select`
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
`;

const MonthSelect = styled(SelectBase)`
  min-width: 4.5rem;
`;

const YearSelect = styled(SelectBase)`
  min-width: 5.5rem;
`;
