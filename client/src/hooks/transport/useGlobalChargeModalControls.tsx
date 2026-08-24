import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "@/context/SeasonContext";
import { useExecuteGlobalTransportCharge } from "./useExecuteGlobalTransportCharge";
import { TransportChargingModal } from "@/components/transport/TransportChargingModal";
import { DEFAULT_TRANSPORT_BILLING } from "@/lib/transportBilling";
import {
  countUnchargedGlobalTransports,
  sumTransportBillingTotals,
} from "@/lib/transportTrackingPricing";
import { listCollection } from "@/lib/collectionApi";
import { collectionKeys, transportGlobalChargeKeys } from "@/lib/queryKeys";
import { fetchGlobalTransportChargePreview } from "@/lib/transportGlobalChargeApi";

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

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
  } = useQuery({
    queryKey: transportGlobalChargeKeys.preview(selectedSeasonYear),
    queryFn: () => fetchGlobalTransportChargePreview(selectedSeasonYear),
    enabled: enabled && chargeModalOpen,
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

  const previewErrorMessage = isPreviewError
    ? previewError instanceof Error
      ? previewError.message
      : "טעינת פרטי החיוב נכשלה"
    : undefined;
  const executeErrorMessage = executeCharge.isError
    ? executeCharge.error instanceof Error
      ? executeCharge.error.message
      : "ביצוע החיוב נכשל"
    : undefined;

  const chargeModal = (
    <TransportChargingModal
      open={chargeModalOpen}
      seasonYear={selectedSeasonYear}
      totalSum={unchargedGlobalTotal}
      rowCount={unchargedGlobalCount}
      preview={preview}
      isPreviewLoading={isPreviewLoading}
      isPending={executeCharge.isPending}
      errorMessage={executeErrorMessage ?? previewErrorMessage}
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
