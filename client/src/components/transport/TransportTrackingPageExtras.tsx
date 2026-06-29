import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import type { CollectionDocument } from "../../schema/types";
import { formatNumber } from "../../lib/formatNumber";
import { buttonBase, toolbarButtonAccent } from "../../styles/buttonStyles";
import {
  useTransportChargeState,
  useUpdateTransportPeriodStartDate,
} from "../../hooks/transport/useTransportChargeState";
import { TransportChargingModal } from "./TransportChargingModal";
import { TRANSPORT_BILLING_TYPES } from "../../lib/transportBilling";
import { sumTransportFinalPricesByBillingInRange } from "../../lib/transportTrackingPricing";

const GLOBAL_BILLING = "חיוב גלובלי";

type TransportTrackingPageExtrasProps = {
  rows: CollectionDocument[];
};

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

const TotalsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const TotalLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const TotalDisplay = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const BillingBreakdown = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
`;

const BillingBreakdownItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const BillingBreakdownRow = styled(BillingBreakdownItem)`
  gap: 0.75rem;
`;

const BillingBreakdownValue = styled.span`
  font-weight: 600;
  color: var(--text-primary);
`;

const ChargeButton = styled.button`
  ${buttonBase};
  ${toolbarButtonAccent};
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 0.35rem 0.75rem;
`;

export function TransportTrackingPageExtras({
  rows,
}: TransportTrackingPageExtrasProps) {
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const { data: chargeState, isLoading } = useTransportChargeState();
  const updatePeriod = useUpdateTransportPeriodStartDate();

  const periodStartDate = chargeState?.periodStartDate ?? "";
  const totalSum = chargeState?.totalSum ?? 0;

  const billingSums = useMemo(
    () => sumTransportFinalPricesByBillingInRange(rows, periodStartDate),
    [rows, periodStartDate],
  );

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
        <TotalsSection>
          <TotalLine>
            <span>סה״כ עלות</span>
            <TotalDisplay>
              {isLoading ? "…" : formatNumber(totalSum)}
            </TotalDisplay>
          </TotalLine>
          {!isLoading && periodStartDate ? (
            <BillingBreakdown>
              {TRANSPORT_BILLING_TYPES.map((billing) => {
                const Row =
                  billing === GLOBAL_BILLING
                    ? BillingBreakdownRow
                    : BillingBreakdownItem;

                return (
                  <Row key={billing}>
                    <span>{billing}:</span>
                    <BillingBreakdownValue>
                      {formatNumber(billingSums[billing])}
                    </BillingBreakdownValue>
                    {billing === GLOBAL_BILLING ? (
                      <ChargeButton
                        type="button"
                        disabled={isLoading}
                        onClick={() => setChargeModalOpen(true)}
                      >
                        בצע חיוב גלובלי
                      </ChargeButton>
                    ) : null}
                  </Row>
                );
              })}
            </BillingBreakdown>
          ) : null}
        </TotalsSection>
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
