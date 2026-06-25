import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  ExportSearchToolbar,
  PageHeaderWithToolbar,
} from "../../components/page/PageHeaderLayout";
import { useSeason } from "../../context/SeasonContext";
import { useOperationsSummary } from "../../hooks/summaries/useOperationsSummary";
import { exportOperationsSummaryExcel } from "../../lib/exportOperationsSummaryExcel";
import { formatNumber } from "../../lib/formatNumber";
import type { OperationsSummaryRow } from "../../lib/operationsSummaryApi";
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
    formatNumber(row.currentCost),
    formatNumber(row.totalAmount),
    row.amountUnit,
    formatNumber(row.totalCharge),
  ];

  return fields.some((field) => field.toLowerCase().includes(needle));
}

export function OperationsSummaryPage() {
  const { selectedSeasonYear } = useSeason();
  const [globalSearch, setGlobalSearch] = useState("");
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useOperationsSummary(selectedSeasonYear);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesGlobalSearch(row, globalSearch)),
    [rows, globalSearch],
  );

  return (
    <div className="page page-collection">
      <PageHeaderWithToolbar
        title="סיכום משימות"
        subtitle={`עונה ${selectedSeasonYear}`}
        toolbar={
          <ExportSearchToolbar
            globalSearch={globalSearch}
            onGlobalSearchChange={setGlobalSearch}
            exportDisabled={visibleRows.length === 0 || isLoading || isError}
            onExportExcel={() =>
              exportOperationsSummaryExcel(visibleRows, selectedSeasonYear)
            }
          />
        }
      />

      <section className="page-body">
        {isLoading && <StatusText>טוען סיכום...</StatusText>}

        {isError && (
          <StatusText $error role="alert">
            {error?.message ?? "שגיאה בטעינת הסיכום"}
          </StatusText>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <StatusText>אין משימות בעונה זו.</StatusText>
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
                    <td>{formatNumber(row.currentCost)}</td>
                    <td>{formatNumber(row.totalAmount)}</td>
                    <td>{formatNumber(row.totalCharge)}</td>
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

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? "#fc8181" : "var(--text-secondary)")};
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
