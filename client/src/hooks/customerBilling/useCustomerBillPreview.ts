/**
 * Loads the printable bill HTML for checked items in the create-billing flow.
 * Builds a CustomerBillRequest from preview + includedIds, then calls fetchCustomerBillPreview
 * (server builds HTML/PDF data; mock builds HTML on the client).
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildCustomerBillRequest,
  fetchCustomerBillPreview,
  hasIncludedBillItems,
  type UnbilledPreview,
} from "../../lib/customerBillingApi";
import { customerBillingKeys } from "../../lib/queryKeys";

type UseCustomerBillPreviewOptions = {
  customerId: string;
  customerName: string;
  preview: UnbilledPreview | undefined;
  includedIds: Set<string>;
  enabled?: boolean;
};

export function useCustomerBillPreview({
  customerId,
  customerName,
  preview,
  includedIds,
  enabled = true,
}: UseCustomerBillPreviewOptions) {
  const request = useMemo(() => {
    if (!preview || !customerId) return null;
    return buildCustomerBillRequest(customerId, preview, includedIds);
  }, [customerId, preview, includedIds]);

  const hasItems = request != null && hasIncludedBillItems(request);

  return useQuery({
    queryKey: customerBillingKeys.billPreview(customerId, request),
    queryFn: () =>
      fetchCustomerBillPreview(request!, {
        customerName,
        preview: preview!,
      }),
    enabled: enabled && Boolean(customerId && preview && hasItems),
  });
}
