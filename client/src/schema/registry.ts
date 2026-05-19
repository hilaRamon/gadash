import type { CollectionSchema } from './types'
import { contractorsSchema } from './collections/contractorsSchema'
import { customersSchema } from './collections/customersSchema'
import { employeesSchema } from './collections/employeesSchema'
import { plotsSchema } from './collections/plotsSchema'
import { agriculturalSeasonsSchema } from './collections/agriculturalSeasonsSchema'
import { fuelTanksSchema } from './collections/fuelTanksSchema'
import { tractorsSchema } from './collections/tractorsSchema'
import { stubSchemas } from './collections/stubSchema'

const allSchemas: CollectionSchema[] = [
  employeesSchema,
  customersSchema,
  contractorsSchema,
  tractorsSchema,
  plotsSchema,
  agriculturalSeasonsSchema,
  fuelTanksSchema,
  ...stubSchemas,
]

const schemasById = Object.fromEntries(
  allSchemas.map((schema) => [schema.id, schema]),
) as Record<string, CollectionSchema>

export function getCollectionSchema(
  collectionId: string,
): CollectionSchema | undefined {
  return schemasById[collectionId]
}

export function getAllCollectionSchemas(): CollectionSchema[] {
  return allSchemas
}
