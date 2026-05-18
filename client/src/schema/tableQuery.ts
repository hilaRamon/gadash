export type SortDirection = 'asc' | 'desc'

export type TableQueryState = {
  columnSearch: Partial<Record<string, string>>
  sort: { field: string; direction: SortDirection } | null
  filter: {
    field: string
    operator: string
    value: string | number | boolean
  } | null
  selectedIds: string[]
}

export type TableQueryParams = {
  q?: Record<string, string>
  sort?: string
  filter?: string
}

export function createInitialTableQueryState(
  defaultSort?: { field: string; direction: SortDirection } | null,
): TableQueryState {
  return {
    columnSearch: {},
    sort: defaultSort ?? null,
    filter: null,
    selectedIds: [],
  }
}

export function toQueryParams(state: TableQueryState): TableQueryParams {
  const params: TableQueryParams = {}

  const qEntries = Object.entries(state.columnSearch).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === 'string' && entry[1].trim() !== '',
  )
  if (qEntries.length > 0) {
    params.q = Object.fromEntries(qEntries)
  }

  if (state.sort) {
    params.sort = `${state.sort.field}:${state.sort.direction}`
  }

  if (state.filter) {
    const { field, operator, value } = state.filter
    params.filter = `${field}:${operator}:${String(value)}`
  }

  return params
}
