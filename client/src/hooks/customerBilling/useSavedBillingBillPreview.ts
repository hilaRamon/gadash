import { useQuery } from "@tanstack/react-query";
import { fetchSavedBillingBillPreview } from "../../lib/customerBillingApi";
import { customerBillingKeys } from "../../lib/queryKeys";
import type { CollectionDocument } from "../../schema/types";

type UseSavedBillingBillPreviewOptions = {
  billing: CollectionDocument | null;
  enabled?: boolean;
};

export function useSavedBillingBillPreview({
  billing,
  enabled = true,
}: UseSavedBillingBillPreviewOptions) {
  const billingId = billing?._id ?? "";

  return useQuery({
    queryKey: customerBillingKeys.savedBillPreview(billingId),
    queryFn: () => fetchSavedBillingBillPreview(billing!),
    enabled: enabled && Boolean(billingId),
  });
}
