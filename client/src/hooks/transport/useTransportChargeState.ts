import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchTransportChargeState,
  updateTransportPeriodStartDate,
} from '../../lib/transportChargeStateApi'
import { transportChargeStateKeys } from '../../lib/queryKeys'

export function useTransportChargeState(enabled = true) {
  return useQuery({
    queryKey: transportChargeStateKeys.detail(),
    queryFn: fetchTransportChargeState,
    enabled,
  })
}

export function useUpdateTransportPeriodStartDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodStartDate: string) =>
      updateTransportPeriodStartDate(periodStartDate),
    onSuccess: (data) => {
      queryClient.setQueryData(transportChargeStateKeys.detail(), data)
    },
  })
}

export function useInvalidateTransportChargeState() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: transportChargeStateKeys.all })
  }
}
