import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from '../../lib/collectionApi'
import { collectionKeys, customerBillingKeys, transportGlobalChargeKeys } from '../../lib/queryKeys'

export function useCreateDocument(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      createDocument(collection, body),
    onSuccess: () => onCollectionMutationSuccess(queryClient, collection),
  })
}

function onCollectionMutationSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  collection: string,
) {
  queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
  if (collection === 'transportGlobalCharges') {
    queryClient.invalidateQueries({ queryKey: customerBillingKeys.all })
    queryClient.invalidateQueries({ queryKey: transportGlobalChargeKeys.all })
  }
}

export function useUpdateDocument(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Record<string, unknown>
    }) => updateDocument(collection, id, body),
    onSuccess: () => onCollectionMutationSuccess(queryClient, collection),
  })
}

export function useDeleteDocument(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocument(collection, id),
    onSuccess: () => onCollectionMutationSuccess(queryClient, collection),
  })
}

export function useBulkDeleteDocuments(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteManyDocuments(collection, ids),
    onSuccess: () => onCollectionMutationSuccess(queryClient, collection),
  })
}
