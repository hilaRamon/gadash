/**
 * React Query wrapper for unbilled items of one customer.
 * Fetches GET /api/customerBillingTrackings/unbilled-preview (or mock equivalent).
 * Result shape: { operations, materialUsage, baleOrders, contractors }.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchUnbilledPreview } from "@/api/customerBillingApi";
import { customerBillingKeys } from "@/queries/queryKeys";

export function useUnbilledPreview(customerId: string) {
  return useQuery({
    queryKey: customerBillingKeys.unbilledPreview(customerId),
    queryFn: () => fetchUnbilledPreview(customerId),
    enabled: Boolean(customerId),
  });
}
