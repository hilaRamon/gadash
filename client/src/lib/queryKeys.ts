import type { TableQueryParams } from '../schema/tableQuery'

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (collection: string, params?: TableQueryParams) =>
    [...collectionKeys.lists(), collection, params ?? {}] as const,
  detail: (collection: string, id: string) =>
    [...collectionKeys.all, 'detail', collection, id] as const,
}

export const transportChargeStateKeys = {
  all: ['transportChargeState'] as const,
  detail: () => [...transportChargeStateKeys.all, 'detail'] as const,
}
