import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from '../../lib/collectionApi'
import { collectionKeys } from '../../lib/queryKeys'

export function useCreateDocument(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      createDocument(collection, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}

export function useDeleteDocument(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocument(collection, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}

export function useBulkDeleteDocuments(collection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteManyDocuments(collection, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}
