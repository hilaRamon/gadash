/**
 * Loads the printable bill HTML for checked items in the create-billing flow.
 * Builds a CustomerBillRequest from preview + includedIds, then calls fetchCustomerBillPreview.
 * The server builds the bill HTML.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildCustomerBillRequest,
  fetchCustomerBillPreview,
  hasIncludedBillItems,
  type UnbilledPreview,
} from "@/api/customerBillingApi";
import { customerBillingKeys } from "@/queries/queryKeys";

type UseCustomerBillPreviewOptions = {
  customerId: string;
  preview: UnbilledPreview | undefined;
  includedIds: Set<string>;
  enabled?: boolean;
};

export function useCustomerBillPreview({
  customerId,
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
    queryFn: () => fetchCustomerBillPreview(request!),
    enabled: enabled && Boolean(customerId && preview && hasItems),
  });
}
