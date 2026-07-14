import { Types } from 'mongoose'
import type { ListFilter, ListQuery } from './listQuery'

export type FieldKind = 'string' | 'number' | 'boolean' | 'date' | 'ref'

export type ListFieldDef = {
  key: string
  path: string
  kind: FieldKind
  refModel?: string
  refNameField?: string
}

export type CollectionListConfig = {
  searchFields: string[]
  fields: ListFieldDef[]
  defaultSort: Record<string, 1 | -1>
  sortFields: Record<string, string>
}

type RefResolver = (
  modelName: string,
  nameField: string,
  search: string,
) => Promise<Types.ObjectId[]>

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsRegex(value: string) {
  return { $regex: escapeRegex(value), $options: 'i' as const }
}

function parseBoolean(value: string): boolean | undefined {
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return undefined
}

function buildOperatorCondition(
  field: ListFieldDef,
  operator: string,
  value: string,
  resolvedRefIds?: Types.ObjectId[],
): Record<string, unknown> | null {
  const path = field.path

  if (field.kind === 'ref') {
    if (!resolvedRefIds || resolvedRefIds.length === 0) {
      return { _id: { $in: [] } }
    }
    if (operator === 'isNot') {
      return { [path]: { $nin: resolvedRefIds } }
    }
    return { [path]: { $in: resolvedRefIds } }
  }

  if (field.kind === 'boolean') {
    const bool = parseBoolean(value)
    if (bool == null) return null
    if (operator === 'isNot') return { [path]: { $ne: bool } }
    return { [path]: bool }
  }

  if (field.kind === 'number') {
    const num = Number(value)
    if (!Number.isFinite(num)) return null
    switch (operator) {
      case 'eq':
      case 'equals':
      case 'is':
        return { [path]: num }
      case 'gt':
        return { [path]: { $gt: num } }
      case 'gte':
        return { [path]: { $gte: num } }
      case 'lt':
        return { [path]: { $lt: num } }
      case 'lte':
        return { [path]: { $lte: num } }
      case 'isNot':
        return { [path]: { $ne: num } }
      default:
        return { [path]: num }
    }
  }

  if (field.kind === 'date') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    switch (operator) {
      case 'eq':
      case 'equals':
      case 'is':
        return { [path]: { $gte: start, $lte: end } }
      case 'gt':
        return { [path]: { $gt: end } }
      case 'gte':
        return { [path]: { $gte: start } }
      case 'lt':
        return { [path]: { $lt: start } }
      case 'lte':
        return { [path]: { $lte: end } }
      default:
        return { [path]: { $gte: start, $lte: end } }
    }
  }

  switch (operator) {
    case 'equals':
    case 'eq':
    case 'is':
      return { [path]: value }
    case 'startsWith':
      return { [path]: { $regex: `^${escapeRegex(value)}`, $options: 'i' } }
    case 'isNot':
      return { [path]: { $ne: value } }
    case 'contains':
    default:
      return { [path]: containsRegex(value) }
  }
}

async function resolveRefIdsForField(
  field: ListFieldDef,
  search: string,
  resolveRefs: RefResolver,
): Promise<Types.ObjectId[]> {
  if (field.kind !== 'ref' || !field.refModel) return []
  return resolveRefs(field.refModel, field.refNameField ?? 'name', search)
}

export async function buildMongoListFilter(
  config: CollectionListConfig,
  listQuery: Pick<ListQuery, 'search' | 'q' | 'filter'>,
  resolveRefs: RefResolver,
  extraFilter: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const clauses: Record<string, unknown>[] = []
  if (Object.keys(extraFilter).length > 0) {
    clauses.push(extraFilter)
  }

  const fieldByKey = new Map(config.fields.map((f) => [f.key, f]))

  if (listQuery.search?.trim()) {
    const needle = listQuery.search.trim()
    const or: Record<string, unknown>[] = []
    for (const key of config.searchFields) {
      const field = fieldByKey.get(key)
      if (!field) continue
      if (field.kind === 'ref') {
        const ids = await resolveRefIdsForField(field, needle, resolveRefs)
        if (ids.length > 0) {
          or.push({ [field.path]: { $in: ids } })
        }
      } else if (field.kind === 'string') {
        or.push({ [field.path]: containsRegex(needle) })
      } else if (field.kind === 'number') {
        const num = Number(needle)
        if (Number.isFinite(num)) or.push({ [field.path]: num })
      }
    }
    if (or.length > 0) {
      clauses.push({ $or: or })
    } else {
      clauses.push({ _id: { $in: [] } })
    }
  }

  if (listQuery.q) {
    for (const [key, raw] of Object.entries(listQuery.q)) {
      const value = raw.trim()
      if (!value) continue
      const field = fieldByKey.get(key)
      if (!field) continue

      if (field.kind === 'boolean') {
        const bool = parseBoolean(value)
        if (bool == null) continue
        clauses.push({ [field.path]: bool })
        continue
      }

      if (field.kind === 'ref') {
        if (Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value) {
          clauses.push({ [field.path]: new Types.ObjectId(value) })
        } else {
          const ids = await resolveRefIdsForField(field, value, resolveRefs)
          clauses.push(
            ids.length > 0
              ? { [field.path]: { $in: ids } }
              : { _id: { $in: [] } },
          )
        }
        continue
      }

      if (field.kind === 'number') {
        const num = Number(value)
        if (Number.isFinite(num)) clauses.push({ [field.path]: num })
        continue
      }

      if (field.kind === 'date') {
        const date = new Date(value)
        if (!Number.isNaN(date.getTime())) {
          const start = new Date(date)
          start.setHours(0, 0, 0, 0)
          const end = new Date(date)
          end.setHours(23, 59, 59, 999)
          clauses.push({ [field.path]: { $gte: start, $lte: end } })
        }
        continue
      }

      clauses.push({ [field.path]: containsRegex(value) })
    }
  }

  if (listQuery.filter) {
    const field = fieldByKey.get(listQuery.filter.field)
    if (field) {
      let resolvedRefIds: Types.ObjectId[] | undefined
      if (field.kind === 'ref') {
        resolvedRefIds = await resolveRefIdsForField(
          field,
          listQuery.filter.value,
          resolveRefs,
        )
      }
      const condition = buildOperatorCondition(
        field,
        listQuery.filter.operator,
        listQuery.filter.value,
        resolvedRefIds,
      )
      if (condition) clauses.push(condition)
    }
  }

  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]!
  return { $and: clauses }
}

// silence unused import for ListFilter if only used in types elsewhere
export type { ListFilter }
