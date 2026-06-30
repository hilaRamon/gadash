import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { useExecuteGlobalTransportCharge } from "./useExecuteGlobalTransportCharge";
import { TransportChargingModal } from "../../components/transport/TransportChargingModal";
import { DEFAULT_TRANSPORT_BILLING } from "../../lib/transportBilling";
import {
  countUnchargedGlobalTransports,
  sumTransportBillingTotals,
} from "../../lib/transportTrackingPricing";
import { listCollection } from "../../lib/collectionApi";
import { collectionKeys } from "../../lib/queryKeys";

export function useGlobalChargeModalControls(enabled = true) {
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const { selectedSeasonYear } = useSeason();
  const executeCharge = useExecuteGlobalTransportCharge();

  const { data: transportRows = [] } = useQuery({
    queryKey: collectionKeys.list("transportTrackings", {
      season: selectedSeasonYear,
    }),
    queryFn: () =>
      listCollection("transportTrackings", { season: selectedSeasonYear }),
    enabled,
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

  const openChargeModal = useCallback(() => {
    setChargeModalOpen(true);
  }, []);

  const handleChargeConfirm = useCallback(() => {
    executeCharge.mutate(selectedSeasonYear, {
      onSuccess: () => {
        setChargeModalOpen(false);
      },
    });
  }, [executeCharge, selectedSeasonYear]);

  const chargeModal = (
    <TransportChargingModal
      open={chargeModalOpen}
      seasonYear={selectedSeasonYear}
      totalSum={unchargedGlobalTotal}
      rowCount={unchargedGlobalCount}
      isPending={executeCharge.isPending}
      errorMessage={
        executeCharge.isError
          ? executeCharge.error instanceof Error
            ? executeCharge.error.message
            : "ביצוע החיוב נכשל"
          : undefined
      }
      onConfirm={handleChargeConfirm}
      onClose={() => {
        if (!executeCharge.isPending) {
          setChargeModalOpen(false);
        }
      }}
    />
  );

  return {
    openChargeModal,
    chargeModal,
    addDisabled: executeCharge.isPending || unchargedGlobalTotal <= 0,
  };
}
