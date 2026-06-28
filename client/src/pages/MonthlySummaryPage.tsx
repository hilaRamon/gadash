import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { NumericMonthPicker } from "../components/reports/NumericMonthPicker";
import { exportMonthlyReportExcel } from "../lib/exportMonthlyReportExcel";
import {
  defaultSelectedMonth,
  formatHours,
  statusLabel,
} from "../lib/monthlyReportApi";
import { useMonthlySummary, useCloseAllEmployeeMonths } from "../hooks/monthlyReport/useMonthlyReport";
import "./Page.css";

export function MonthlySummaryPage() {
  const [searchParams] = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get("month") ?? defaultSelectedMonth(),
  );

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useMonthlySummary(selectedMonth);
  const closeAllMonths = useCloseAllEmployeeMonths(selectedMonth);
  const hasOpenRows = rows.some((row) => row.status === "open");

  useEffect(() => {
    const month = searchParams.get("month");
    if (month) setSelectedMonth(month);
  }, [searchParams]);

  return (
    <div className="page page-collection">
      <PageHeader>
        <PageTitle>סיכום חודשי</PageTitle>
      </PageHeader>

      <section className="page-body">
        <Toolbar>
          <FilterField>
            <FilterLabel htmlFor="summary-month">חודש</FilterLabel>
            <NumericMonthPicker
              id="summary-month"
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </FilterField>

          <ExportButton
            type="button"
            disabled={rows.length === 0 || isLoading}
            onClick={() => exportMonthlyReportExcel(rows, selectedMonth)}
          >
            ייצוא לאקסל
          </ExportButton>

          <CloseButton
            type="button"
            disabled={
              rows.length === 0 || isLoading || !hasOpenRows || closeAllMonths.isPending
            }
            onClick={() => closeAllMonths.mutate()}
          >
            {closeAllMonths.isPending ? "סוגר..." : "סגור חודש"}
          </CloseButton>
        </Toolbar>

        {closeAllMonths.isError && (
          <StatusText $error role="alert">
            {closeAllMonths.error?.message ?? "שגיאה בסגירת החודש"}
          </StatusText>
        )}

        {isLoading && <StatusText>טוען סיכום...</StatusText>}

        {isError && (
          <StatusText $error role="alert">
            {error?.message ?? "שגיאה בטעינת הסיכום"}
          </StatusText>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <StatusText>אין עובדים שעבדו בחודש זה.</StatusText>
        )}

        {rows.length > 0 && (
          <TableWrap>
            <SummaryTable>
              <thead>
                <tr>
                  <th>עובד</th>
                  <th>ימי עבודה</th>
                  <th>{"סה\"כ שעות"}</th>
                  <th>שעות רגילות</th>
                  <th>125%</th>
                  <th>150%</th>
                  <th>מחלה</th>
                  <th>חופש</th>
                  <th>מילואים</th>
                  <th>סטטוס</th>
                  <th>פירוט</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td>{row.employeeName}</td>
                    <td>{row.totalDaysWorked}</td>
                    <td>{formatHours(row.totalHours)}</td>
                    <td>{formatHours(row.regularHours)}</td>
                    <td>{formatHours(row.overtime125Hours)}</td>
                    <td>{formatHours(row.overtime150Hours)}</td>
                    <td>{row.sickDays}</td>
                    <td>{row.vacationDays}</td>
                    <td>{row.reserveDays}</td>
                    <td>
                      <StatusBadge $closed={row.status === "closed"}>
                        {statusLabel(row.status)}
                      </StatusBadge>
                    </td>
                    <td>
                      <DetailLink
                        to={`/reports/employee-monthly?employeeId=${encodeURIComponent(row.employeeId)}&month=${encodeURIComponent(selectedMonth)}`}
                      >
                        דוח עובד
                      </DetailLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </SummaryTable>
          </TableWrap>
        )}
      </section>
    </div>
  );
}

const PageHeader = styled.header`
  margin-bottom: 1rem;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
`;

const ExportButton = styled.button`
  padding: 0.55rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  padding: 0.55rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: var(--text-on-brand);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? 'var(--color-error-text)' : 'var(--text-secondary)')};
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const SummaryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;

  th,
  td {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid var(--border-color);
    text-align: start;
    white-space: nowrap;
  }

  th {
    color: var(--text-secondary);
    font-weight: 600;
    background: var(--hover-bg);
  }
`;

const StatusBadge = styled.span<{ $closed: boolean }>`
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $closed }) => ($closed ? 'var(--color-success-soft)' : 'var(--color-warning-soft)')};
  color: ${({ $closed }) => ($closed ? 'var(--color-success)' : 'var(--color-warning)')};
`;

const DetailLink = styled(Link)`
  color: var(--accent);
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
`;
