import { useMemo } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "../../lib/formatNumber";
import { useSeason } from "../../context/SeasonContext";
import { DEFAULT_TRANSPORT_BILLING } from "../../lib/transportBilling";
import {
  countUnchargedGlobalTransports,
  sumTransportBillingTotals,
} from "../../lib/transportTrackingPricing";
import { useCollectionList } from "../../hooks/collections/useCollectionList";
import { fetchGlobalTransportChargePreview } from "../../lib/transportGlobalChargeApi";
import { transportGlobalChargeKeys } from "../../lib/queryKeys";

const ExtrasRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  width: 100%;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const SeasonValue = styled.span`
  font-weight: 700;
  color: var(--text-primary);
`;

const TotalValue = styled.span`
  font-weight: 700;
  color: var(--text-primary);
`;

export function TransportGlobalChargePageExtras() {
  const { selectedSeasonYear } = useSeason();

  const { data: transportRows = [] } = useCollectionList("transportTrackings", {
    season: selectedSeasonYear,
  });

  const billingTotals = useMemo(
    () => sumTransportBillingTotals(transportRows),
    [transportRows],
  );

  const unchargedGlobalTotal =
    billingTotals.unchargedTotal[DEFAULT_TRANSPORT_BILLING];
  const unchargedGlobalCount = useMemo(
    () => countUnchargedGlobalTransports(transportRows),
    [transportRows],
  );

  const { data: preview } = useQuery({
    queryKey: transportGlobalChargeKeys.preview(selectedSeasonYear),
    queryFn: () => fetchGlobalTransportChargePreview(selectedSeasonYear),
    enabled: unchargedGlobalTotal > 0,
  });

  return (
    <ExtrasRow>
      <span>
        עונה <SeasonValue>{selectedSeasonYear}</SeasonValue>
      </span>
      <span>
        נותר לחיוב גלובלי:{" "}
        <TotalValue>{formatNumber(unchargedGlobalTotal)}</TotalValue>
        {unchargedGlobalCount > 0 ? ` (${unchargedGlobalCount} הובלות)` : null}
      </span>
      {preview && unchargedGlobalTotal > 0 ? (
        <span>
          מחיר לדונם משוער:{" "}
          <TotalValue>{formatNumber(preview.pricePerDunam)}</TotalValue>
        </span>
      ) : null}
    </ExtrasRow>
  );
}
