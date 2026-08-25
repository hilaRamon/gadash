import { useState } from "react";
import styled from "styled-components";
import { NumericMonthPicker } from "@/components/reports/NumericMonthPicker";
import { useInvoiceMonthlySummary } from "@/queries/invoices/useInvoiceMonthlySummary";
import { formatNumber2 } from "@/lib/formatNumber";
import { defaultSelectedMonth } from "@/api/monthlyReportApi";

export function InvoiceMonthlySummary() {
  const [month, setMonth] = useState(defaultSelectedMonth);
  const { data, isLoading, isError } = useInvoiceMonthlySummary(month);

  const totalAmount = data?.totalAmount ?? 0;
  const paidAmount = data?.paidAmount ?? 0;
  const unpaidAmount = data?.unpaidAmount ?? 0;

  return (
    <ExtrasRow>
      <FilterField>
        <FilterLabel htmlFor="invoice-due-month">חודש לתשלום</FilterLabel>
        <NumericMonthPicker
          id="invoice-due-month"
          value={month}
          onChange={setMonth}
        />
      </FilterField>
      {isError ? (
        <StatusText $error role="alert">
          שגיאה בטעינת הסיכום
        </StatusText>
      ) : (
        <>
          <TotalLine>
            <span>סה״כ לתשלום</span>
            <TotalDisplay>
              {isLoading ? "…" : formatNumber2(totalAmount)}
            </TotalDisplay>
          </TotalLine>
          <TotalLine>
            <span>שולם</span>
            <TotalDisplay>
              {isLoading ? "…" : formatNumber2(paidAmount)}
            </TotalDisplay>
          </TotalLine>
          <TotalLine>
            <span>נותר לתשלום</span>
            <TotalDisplay>
              {isLoading ? "…" : formatNumber2(unpaidAmount)}
            </TotalDisplay>
          </TotalLine>
        </>
      )}
    </ExtrasRow>
  );
}

const ExtrasRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
  width: 100%;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
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

const TotalLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  padding-bottom: 0.35rem;
`;

const TotalDisplay = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding-bottom: 0.35rem;
  font-size: 0.875rem;
  color: ${({ $error }) =>
    $error ? "var(--color-error-text)" : "var(--text-secondary)"};
`;
