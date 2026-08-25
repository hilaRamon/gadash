/**
 * React Query wrapper for the customer dropdown on the create-billing page.
 * Fetches GET /api/customerBillingTrackings/customers-with-unbilled (or mock equivalent).
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCustomersWithUnbilled } from "@/api/customerBillingApi";
import { customerBillingKeys } from "@/queries/queryKeys";

export function useCustomersWithUnbilled() {
  return useQuery({
    queryKey: customerBillingKeys.customersWithUnbilled(),
    queryFn: fetchCustomersWithUnbilled,
  });
}
