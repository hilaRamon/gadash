import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import {
  useEmployeeMonthlyReport,
  useMonthlySummary,
  useUpdateMonthlyAbsence,
} from "../hooks/monthlyReport/useMonthlyReport";
import { NumericMonthPicker } from "../components/reports/NumericMonthPicker";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { exportEmployeeMonthlyReportExcel } from "../lib/exportMonthlyReportExcel";
import {
  defaultSelectedMonth,
  formatHours,
  formatReportDate,
  statusLabel,
  type AbsenceDays,
} from "../lib/monthlyReportApi";
import "./Page.css";

export function EmployeeMonthlyReportPage() {
  const [searchParams] = useSearchParams();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    searchParams.get("employeeId") ?? "",
  );
  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get("month") ?? defaultSelectedMonth(),
  );
  const [absenceDraft, setAbsenceDraft] = useState<AbsenceDays>({
    sickDays: 0,
    vacationDays: 0,
    reserveDays: 0,
  });

  const { data: workedEmployees = [], isLoading: employeesLoading } =
    useMonthlySummary(selectedMonth);
  const showReport = Boolean(selectedEmployeeId && selectedMonth);
  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
    error: reportErrorObj,
  } = useEmployeeMonthlyReport(selectedEmployeeId, selectedMonth);
  const updateAbsence = useUpdateMonthlyAbsence(
    selectedEmployeeId,
    selectedMonth,
  );

  useEffect(() => {
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    if (employeeId) setSelectedEmployeeId(employeeId);
    if (month) setSelectedMonth(month);
  }, [searchParams]);

  useEffect(() => {
    if (employeesLoading) return;
    if (
      selectedEmployeeId &&
      !workedEmployees.some((row) => row.employeeId === selectedEmployeeId)
    ) {
      setSelectedEmployeeId("");
    }
  }, [workedEmployees, selectedEmployeeId, employeesLoading]);

  useEffect(() => {
    if (!report) return;
    setAbsenceDraft(report.absence);
  }, [report]);

  const isClosed = report?.status === "closed";
  const workingDaysCount = report?.days.length ?? 0;
  const footerTotals = useMemo(() => {
    if (!report) return null;
    if (isClosed) return report.totals;
    return report.days.reduce(
      (acc, day) => ({
        totalHours: acc.totalHours + day.totalHours,
        regularHours: acc.regularHours + day.regularHours,
        overtime125Hours: acc.overtime125Hours + day.overtime125Hours,
        overtime150Hours: acc.overtime150Hours + day.overtime150Hours,
        totalDaysWorked: report.days.length,
      }),
      {
        totalHours: 0,
        regularHours: 0,
        overtime125Hours: 0,
        overtime150Hours: 0,
        totalDaysWorked: 0,
      },
    );
  }, [report, isClosed]);

  const employeeOptions = useMemo(
    () =>
      workedEmployees.map((employee) => ({
        value: employee.employeeId,
        label: employee.employeeName,
      })),
    [workedEmployees],
  );

  const handleAbsenceBlur = () => {
    if (!report || isClosed) return;
    if (
      absenceDraft.sickDays === report.absence.sickDays &&
      absenceDraft.vacationDays === report.absence.vacationDays &&
      absenceDraft.reserveDays === report.absence.reserveDays
    ) {
      return;
    }
    updateAbsence.mutate(absenceDraft);
  };

  return (
    <div className="page page-collection">
      <PageHeader>
        <PageTitle>דוח חודשי לעובד</PageTitle>
      </PageHeader>

      <section className="page-body">
        <FiltersRow>
          <FilterField>
            <FilterLabel htmlFor="employee-select">עובד</FilterLabel>
            {employeesLoading ? (
              <StatusText>טוען עובדים...</StatusText>
            ) : workedEmployees.length === 0 ? (
              <StatusText>אין עובדים שעבדו בחודש זה</StatusText>
            ) : (
              <SearchableSelect
                id="employee-select"
                value={selectedEmployeeId}
                options={employeeOptions}
                placeholder="בחר עובד..."
                onChange={setSelectedEmployeeId}
              />
            )}
          </FilterField>

          <FilterField>
            <FilterLabel htmlFor="month-select">חודש</FilterLabel>
            <NumericMonthPicker
              id="month-select"
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </FilterField>

          {report && footerTotals && (
            <ExportButton
              type="button"
              disabled={report.days.length === 0}
              onClick={() =>
                exportEmployeeMonthlyReportExcel(report, {
                  footerTotals,
                  workingDaysCount,
                })
              }
            >
              ייצוא לאקסל
            </ExportButton>
          )}
          {report && (
            <StatusBadge $closed={isClosed}>
              {statusLabel(report.status)}
            </StatusBadge>
          )}
        </FiltersRow>

        {!showReport && workedEmployees.length > 0 && (
          <StatusText>בחר עובד וחודש כדי להציג את הדוח.</StatusText>
        )}

        {showReport && reportLoading && <StatusText>טוען דוח...</StatusText>}

        {showReport && reportError && (
          <StatusText $error role="alert">
            {reportErrorObj?.message ?? "שגיאה בטעינת הדוח"}
          </StatusText>
        )}

        {showReport && report && (
          <>
            <TableWrap>
              <ReportTable>
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>{'סה"כ שעות'}</th>
                    <th>שעות רגילות</th>
                    <th>שעות נוספות 125%</th>
                    <th>שעות נוספות 150%</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyCell>אין ימי עבודה בחודש זה</EmptyCell>
                      </td>
                    </tr>
                  ) : (
                    report.days.map((day) => (
                      <tr key={day.date}>
                        <td>{formatReportDate(day.date)}</td>
                        <td>{formatHours(day.totalHours)}</td>
                        <td>{formatHours(day.regularHours)}</td>
                        <td>{formatHours(day.overtime125Hours)}</td>
                        <td>{formatHours(day.overtime150Hours)}</td>
                      </tr>
                    ))
                  )}
                  {footerTotals && report.days.length > 0 && (
                    <tr>
                      <TotalCell>סה"כ</TotalCell>
                      <TotalCell>
                        {formatHours(footerTotals.totalHours)}
                      </TotalCell>
                      <TotalCell>
                        {formatHours(footerTotals.regularHours)}
                      </TotalCell>
                      <TotalCell>
                        {formatHours(footerTotals.overtime125Hours)}
                      </TotalCell>
                      <TotalCell>
                        {formatHours(footerTotals.overtime150Hours)}
                      </TotalCell>
                    </tr>
                  )}
                </tbody>
              </ReportTable>
            </TableWrap>

            <SummarySection>
              <DaysSummaryTitle>סיכום ימים</DaysSummaryTitle>
              <DaysSummaryTable>
                <thead>
                  <tr>
                    <th>ימי עבודה</th>
                    <th>מחלה</th>
                    <th>חופש</th>
                    <th>מילואים</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <ReadOnlyValue>
                        {isClosed
                          ? report.totals.totalDaysWorked
                          : workingDaysCount}
                      </ReadOnlyValue>
                    </td>
                    <td>
                      <AbsenceInput
                        type="number"
                        min={0}
                        step={1}
                        disabled={isClosed}
                        value={absenceDraft.sickDays}
                        onChange={(event) =>
                          setAbsenceDraft((prev) => ({
                            ...prev,
                            sickDays: Number(event.target.value) || 0,
                          }))
                        }
                        onBlur={handleAbsenceBlur}
                      />
                    </td>
                    <td>
                      <AbsenceInput
                        type="number"
                        min={0}
                        step={1}
                        disabled={isClosed}
                        value={absenceDraft.vacationDays}
                        onChange={(event) =>
                          setAbsenceDraft((prev) => ({
                            ...prev,
                            vacationDays: Number(event.target.value) || 0,
                          }))
                        }
                        onBlur={handleAbsenceBlur}
                      />
                    </td>
                    <td>
                      <AbsenceInput
                        type="number"
                        min={0}
                        step={1}
                        disabled={isClosed}
                        value={absenceDraft.reserveDays}
                        onChange={(event) =>
                          setAbsenceDraft((prev) => ({
                            ...prev,
                            reserveDays: Number(event.target.value) || 0,
                          }))
                        }
                        onBlur={handleAbsenceBlur}
                      />
                    </td>
                  </tr>
                </tbody>
              </DaysSummaryTable>
            </SummarySection>

            <ActionsRow>
              <SummaryLink
                to={`/reports/monthly-summary?month=${encodeURIComponent(selectedMonth)}`}
              >
                לסיכום חודשי לכל העובדים
              </SummaryLink>
            </ActionsRow>
          </>
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

const FiltersRow = styled.div`
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
  min-width: 12rem;
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

const StatusBadge = styled.span<{ $closed: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: ${({ $closed }) =>
    $closed ? 'var(--color-success-soft)' : 'var(--color-warning-soft)'};
  color: ${({ $closed }) => ($closed ? 'var(--color-success)' : 'var(--color-warning)')};
`;

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? 'var(--color-error-text)' : 'var(--text-secondary)')};
`;

const TableWrap = styled.div`
  overflow-x: auto;
  margin-bottom: 1.5rem;
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;

  th,
  td {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid var(--border-color);
    text-align: start;
  }

  th {
    color: var(--text-secondary);
    font-weight: 600;
    background: var(--hover-bg);
  }
`;

const EmptyCell = styled.span`
  color: var(--text-secondary);
`;

const TotalCell = styled.td`
  font-weight: 700;
  background: var(--hover-bg);
`;

const SummarySection = styled.section`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--card-bg);
`;

const DaysSummaryTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 1rem;
`;

const DaysSummaryTable = styled.table`
  width: auto;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    text-align: center;
  }

  th {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    background: var(--hover-bg);
  }
`;

const ReadOnlyValue = styled.span`
  display: inline-block;
  min-width: 4.5rem;
  font-weight: 600;
`;

const AbsenceInput = styled.input`
  width: 4.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  text-align: center;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;

const SummaryLink = styled(Link)`
  font-size: 0.875rem;
  color: var(--accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
