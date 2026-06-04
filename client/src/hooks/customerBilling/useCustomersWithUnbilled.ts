import { useQuery } from "@tanstack/react-query";
import { fetchCustomersWithUnbilled } from "../../lib/customerBillingApi";
import { customerBillingKeys } from "../../lib/queryKeys";

export function useCustomersWithUnbilled() {
  return useQuery({
    queryKey: customerBillingKeys.customersWithUnbilled(),
    queryFn: fetchCustomersWithUnbilled,
  });
}
