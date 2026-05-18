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

  const setColumnSearch = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      columnSearch: { ...prev.columnSearch, [key]: value },
    }))
  }, [])

  const setSort = useCallback(
    (field: string | '', direction: SortDirection = 'asc') => {
      setState((prev) => ({
        ...prev,
        sort: field ? { field, direction } : null,
      }))
    },
    [],
  )

  const setSortDirection = useCallback((direction: SortDirection) => {
    setState((prev) =>
      prev.sort ? { ...prev, sort: { ...prev.sort, direction } } : prev,
    )
  }, [])

  const setFilter = useCallback(
    (
      filter: TableQueryState['filter'],
    ) => {
      setState((prev) => ({ ...prev, filter }))
    },
    [],
  )

  const toggleSelected = useCallback((id: string) => {
    setState((prev) => {
      const selected = new Set(prev.selectedIds)
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      return { ...prev, selectedIds: [...selected] }
    })
  }, [])

  const setSelectedIds = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, selectedIds: ids }))
  }, [])

  const toggleSelectAll = useCallback((visibleIds: string[]) => {
    setState((prev) => {
      const allSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => prev.selectedIds.includes(id))
      return {
        ...prev,
        selectedIds: allSelected ? [] : [...visibleIds],
      }
    })
  }, [])

  const resetSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedIds: [] }))
  }, [])

  return {
    state,
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
