import type { CollectionSchema } from './types'
import { stubSchemas } from './collections/stubSchema'

const schemasById = Object.fromEntries(
  stubSchemas.map((schema) => [schema.id, schema]),
) as Record<string, CollectionSchema>

export function getCollectionSchema(
  collectionId: string,
): CollectionSchema | undefined {
  return schemasById[collectionId]
}

export function getAllCollectionSchemas(): CollectionSchema[] {
  return stubSchemas
}
