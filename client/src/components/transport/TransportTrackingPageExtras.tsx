import { useMemo } from "react";
import styled from "styled-components";
import type { CollectionDocument } from "../../schema/types";
import { formatNumber } from "../../lib/formatNumber";
import { useSeason } from "../../context/SeasonContext";
import {
  TRANSPORT_BILLING_TYPES,
  type TransportBillingType,
} from "../../lib/transportBilling";
import {
  sumAllTransportFinalPrices,
  sumTransportBillingTotals,
} from "../../lib/transportTrackingPricing";

const GLOBAL_BILLING = "חיוב גלובלי";
const CUSTOMER_BILLING = "חיוב ללקוח";

type TransportTrackingPageExtrasProps = {
  rows: CollectionDocument[];
};

const ExtrasRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem 1.5rem;
  width: 100%;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
`;

const SeasonLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-shrink: 0;
`;

const SeasonValue = styled.span`
  font-weight: 700;
  color: var(--text-primary);
`;

const TotalLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-shrink: 0;
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
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
`;

const BillingBreakdownItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
`;

const BillingBreakdownValue = styled.span`
  font-weight: 600;
  color: var(--text-primary);
`;

const BillingSplit = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const SplitDivider = styled.span`
  color: var(--border-color);
`;

function showsSplitTotal(billing: TransportBillingType): boolean {
  return billing === GLOBAL_BILLING || billing === CUSTOMER_BILLING;
}

export function TransportTrackingPageExtras({
  rows,
}: TransportTrackingPageExtrasProps) {
  const { selectedSeasonYear } = useSeason();

  const billingTotals = useMemo(
    () => sumTransportBillingTotals(rows),
    [rows],
  );

  const totalSum = useMemo(() => sumAllTransportFinalPrices(rows), [rows]);

  return (
    <ExtrasRow>
      <SeasonLabel>
        עונה <SeasonValue>{selectedSeasonYear}</SeasonValue>
      </SeasonLabel>
      <TotalLine>
        <span>סה״כ עלות</span>
        <TotalDisplay>{formatNumber(totalSum)}</TotalDisplay>
      </TotalLine>
      <BillingBreakdown>
        {TRANSPORT_BILLING_TYPES.map((billing) => (
          <BillingBreakdownItem key={billing}>
            <span>{billing}:</span>
            {showsSplitTotal(billing) ? (
              <BillingSplit>
                <span>
                  סה״כ עונה{" "}
                  <BillingBreakdownValue>
                    {formatNumber(billingTotals.seasonTotal[billing])}
                  </BillingBreakdownValue>
                </span>
                <SplitDivider>|</SplitDivider>
                <span>
                  נותר לחיוב{" "}
                  <BillingBreakdownValue>
                    {formatNumber(billingTotals.unchargedTotal[billing])}
                  </BillingBreakdownValue>
                </span>
              </BillingSplit>
            ) : (
              <span>
                סה״כ עונה{" "}
                <BillingBreakdownValue>
                  {formatNumber(billingTotals.seasonTotal[billing])}
                </BillingBreakdownValue>
              </span>
            )}
          </BillingBreakdownItem>
        ))}
      </BillingBreakdown>
    </ExtrasRow>
  );
}
