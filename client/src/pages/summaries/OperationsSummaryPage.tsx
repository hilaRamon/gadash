import { useMemo, useState } from "react";
import styled from "styled-components";
import { formatReportMonth } from "@/api/monthlyReportApi";
import {
  ExportSearchToolbar,
  PageHeaderWithToolbar,
} from "@/components/page/PageHeaderLayout";
import { ActionTooltip } from "@/components/collection/DataTable/ActionTooltip";
import { NumericMonthPicker } from "@/components/reports/NumericMonthPicker";
import { useSeason } from "@/context/SeasonContext";
import { useOperationsSummary } from "@/queries/summaries/useOperationsSummary";
import { exportOperationsSummaryExcel } from "@/lib/excel/exportOperationsSummaryExcel";
import { formatNumber1 } from "@/lib/formatNumber";
import { buttonHoverLighten } from "@/styles/buttonStyles";
import type { OperationsSummaryRow } from "@/api/operationsSummaryApi";
import "../Page.css";

function matchesGlobalSearch(
  row: OperationsSummaryRow,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  const fields = [
    row.operationName,
    row.pricingForm ?? "",
    row.currentCost == null ? "—" : formatNumber1(row.currentCost),
    formatNumber1(row.totalAmount),
    row.amountUnit,
    formatNumber1(row.totalCharge),
  ];

  return fields.some((field) => field.toLowerCase().includes(needle));
}

export function OperationsSummaryPage() {
  const { selectedSeasonYear } = useSeason();
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useOperationsSummary(selectedSeasonYear, selectedMonth || undefined);

  const subtitle = selectedMonth
    ? `עונה ${selectedSeasonYear} · ${formatReportMonth(selectedMonth)}`
    : `עונה ${selectedSeasonYear}`;

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesGlobalSearch(row, globalSearch)),
    [rows, globalSearch],
  );

  return (
    <div className="page page-collection">
      <PageHeaderWithToolbar
        title="סיכום משימות"
        subtitle={subtitle}
        toolbar={
          <ExportSearchToolbar
            globalSearch={globalSearch}
            onGlobalSearchChange={setGlobalSearch}
            exportDisabled={visibleRows.length === 0 || isLoading || isError}
            onExportExcel={() =>
              exportOperationsSummaryExcel(
                visibleRows,
                selectedSeasonYear,
                selectedMonth || undefined,
              )
            }
          />
        }
      >
        <FilterRow>
          <FilterField>
            <FilterLabel htmlFor="operations-summary-month">חודש</FilterLabel>
            <PickerActions>
              <NumericMonthPicker
                id="operations-summary-month"
                value={selectedMonth}
                onChange={setSelectedMonth}
                allowEmpty
              />
              {selectedMonth ? (
                <ActionTooltip text="הצג את כל העונה">
                  <CloseFilterButton
                    type="button"
                    onClick={() => setSelectedMonth("")}
                  >
                    <CloseMark aria-hidden="true">×</CloseMark>
                    נקה סינון
                  </CloseFilterButton>
                </ActionTooltip>
              ) : null}
            </PickerActions>
          </FilterField>
        </FilterRow>
      </PageHeaderWithToolbar>

      <section className="page-body">
        {isLoading && <StatusText>טוען סיכום...</StatusText>}

        {isError && (
          <StatusText $error role="alert">
            {error?.message ?? "שגיאה בטעינת הסיכום"}
          </StatusText>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <StatusText>
            {selectedMonth ? "אין משימות בחודש זה." : "אין משימות בעונה זו."}
          </StatusText>
        )}

        {!isLoading &&
          !isError &&
          rows.length > 0 &&
          visibleRows.length === 0 && <StatusText>לא נמצאו תוצאות.</StatusText>}

        {visibleRows.length > 0 && (
          <TableWrap>
            <SummaryTable>
              <thead>
                <tr>
                  <th>שם הפעולה</th>
                  <th>צורת תמחור</th>
                  <th>מחיר</th>
                  <th>{'סה"כ כמות'}</th>
                  <th>{'סה"כ חיוב'}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.operationId}>
                    <td>{row.operationName}</td>
                    <td>{row.pricingForm ?? "—"}</td>
                    <td>
                      {row.currentCost == null ? "—" : formatNumber1(row.currentCost)}
                    </td>
                    <td>{formatNumber1(row.totalAmount)}</td>
                    <td>{formatNumber1(row.totalCharge)}</td>
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

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  width: 100%;
  padding-top: 0.25rem;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
`;

const PickerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const CloseFilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 2.25rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--color-error);
  color: var(--text-on-error);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  ${buttonHoverLighten};

  &:hover {
    background: var(--color-error-hover);
  }
`;

const CloseMark = styled.span`
  font-size: 1.05rem;
  line-height: 1;
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
