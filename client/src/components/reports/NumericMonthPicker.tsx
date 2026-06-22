import styled from "styled-components";
import {
  buildMonthValue,
  parseMonthValue,
  yearOptions,
} from "../../lib/monthlyReportApi";

type NumericMonthPickerProps = {
  id?: string;
  value: string;
  onChange: (month: string) => void;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function NumericMonthPicker({
  id,
  value,
  onChange,
}: NumericMonthPickerProps) {
  const { year, month } = parseMonthValue(value);
  const years = yearOptions();

  return (
    <PickerRow id={id}>
      <MonthSelect
        aria-label="חודש"
        value={month}
        onChange={(event) =>
          onChange(buildMonthValue(year, Number(event.target.value)))
        }
      >
        {MONTH_OPTIONS.map((monthOption) => (
          <option key={monthOption} value={monthOption}>
            {monthOption}
          </option>
        ))}
      </MonthSelect>
      <YearSelect
        aria-label="שנה"
        value={year}
        onChange={(event) =>
          onChange(buildMonthValue(Number(event.target.value), month))
        }
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
