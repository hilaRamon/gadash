import { useCallback, useState } from 'react'
import type { CollectionSchema } from '../schema/types'
import {
  createInitialTableQueryState,
  type SortDirection,
  type TableQueryState,
} from '../schema/tableQuery'

export function useTableQueryState(schema: CollectionSchema) {
  const [state, setState] = useState<TableQueryState>(() =>
    createInitialTableQueryState(schema.defaultSort ?? null),
  )

  const patchState = useCallback(
    (patch: Partial<TableQueryState> | ((prev: TableQueryState) => TableQueryState)) => {
      setState((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
        return { ...next, globalSearch: next.globalSearch ?? '' }
      })
    },
    [],
  )

  const setGlobalSearch = useCallback((value: string) => {
    patchState({ globalSearch: value })
  }, [patchState])

  const setColumnSearch = useCallback((key: string, value: string) => {
    patchState((prev) => ({
      ...prev,
      columnSearch: { ...prev.columnSearch, [key]: value },
    }))
  }, [patchState])

  const setSort = useCallback(
    (field: string | '', direction: SortDirection = 'asc') => {
      patchState((prev) => ({
        ...prev,
        sort: field ? { field, direction } : null,
      }))
    },
    [patchState],
  )

  const setSortDirection = useCallback((direction: SortDirection) => {
    patchState((prev) =>
      prev.sort ? { ...prev, sort: { ...prev.sort, direction } } : prev,
    )
  }, [patchState])

  const setFilter = useCallback(
    (
      filter: TableQueryState['filter'],
    ) => {
      patchState({ filter })
    },
    [patchState],
  )

  const toggleSelected = useCallback((id: string) => {
    patchState((prev) => {
      const selected = new Set(prev.selectedIds)
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      return { ...prev, selectedIds: [...selected] }
    })
  }, [patchState])

  const setSelectedIds = useCallback((ids: string[]) => {
    patchState({ selectedIds: ids })
  }, [patchState])

  const toggleSelectAll = useCallback((visibleIds: string[]) => {
    patchState((prev) => {
      const allSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => prev.selectedIds.includes(id))
      return {
        ...prev,
        selectedIds: allSelected ? [] : [...visibleIds],
      }
    })
  }, [patchState])

  const resetSelection = useCallback(() => {
    patchState({ selectedIds: [] })
  }, [patchState])

  return {
    state,
    setGlobalSearch,
    setColumnSearch,
    setSort,
    setSortDirection,
    setFilter,
    toggleSelected,
    setSelectedIds,
    toggleSelectAll,
    resetSelection,
  }
}
