import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeGlobalTransportCharge } from "@/api/transportGlobalChargeApi"
import { collectionKeys, customerBillingKeys, transportGlobalChargeKeys } from "@/queries/queryKeys"

export function useExecuteGlobalTransportCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (seasonYear: number) => executeGlobalTransportCharge(seasonYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerBillingKeys.all })
      queryClient.invalidateQueries({ queryKey: transportGlobalChargeKeys.all })
    },
  })
}
