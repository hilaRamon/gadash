import { useCallback, useMemo, useState } from "react";
import styled, { css } from "styled-components";
import type { CollectionDocument } from "../../schema/types";
import { formatNumber } from "../../lib/formatNumber";
import {
  useTransportChargeState,
  useUpdateTransportPeriodStartDate,
} from "../../hooks/transport/useTransportChargeState";
import { TransportChargingModal } from "./TransportChargingModal";

type TransportTrackingPageExtrasProps = {
  rows: CollectionDocument[];
};

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--accent);
  border-color: transparent;
  color: #0d1114;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExtrasRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  width: 100%;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
`;

const FieldGroup = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const DateInput = styled.input`
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
`;

const TotalDisplay = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const ChargeButton = styled.button`
  ${buttonBase};
`;

export function TransportTrackingPageExtras({
  rows,
}: TransportTrackingPageExtrasProps) {
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const { data: chargeState, isLoading } = useTransportChargeState();
  const updatePeriod = useUpdateTransportPeriodStartDate();

  const periodStartDate = chargeState?.periodStartDate ?? "";
  const totalSum = chargeState?.totalSum ?? 0;

  const rowCount = useMemo(() => {
    if (!periodStartDate) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((row) => {
      const dateKey = String(row.date ?? "").slice(0, 10);
      return dateKey >= periodStartDate && dateKey <= today;
    }).length;
  }, [rows, periodStartDate]);

  const handleDateChange = useCallback(
    (value: string) => {
      if (!value) return;
      updatePeriod.mutate(value);
    },
    [updatePeriod],
  );

  const handleChargeConfirm = useCallback(() => {
    setChargeModalOpen(false);
  }, []);

  return (
    <>
      <ExtrasRow>
        <FieldGroup>
          מתאריך
          <DateInput
            type="date"
            value={periodStartDate}
            disabled={isLoading || updatePeriod.isPending}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup as="div">
          סה״כ עלות
          <TotalDisplay>
            {isLoading ? "…" : formatNumber(totalSum)}
          </TotalDisplay>
        </FieldGroup>
        <ChargeButton
          type="button"
          disabled={isLoading}
          onClick={() => setChargeModalOpen(true)}
        >
          ביצוע חיוב
        </ChargeButton>
      </ExtrasRow>

      <TransportChargingModal
        open={chargeModalOpen}
        periodStartDate={periodStartDate}
        totalSum={totalSum}
        rowCount={rowCount}
        onConfirm={handleChargeConfirm}
        onClose={() => setChargeModalOpen(false)}
      />
    </>
  );
}
