import type { CollectionSchema } from "./types";
import { contractorsSchema } from "./collections/contractorsSchema";
import { customersSchema } from "./collections/customersSchema";
import { employeesSchema } from "./collections/employeesSchema";
import { plotsSchema } from "./collections/plotsSchema";
import { agriculturalSeasonsSchema } from "./collections/agriculturalSeasonsSchema";
import { fuelTanksSchema } from "./collections/fuelTanksSchema";
import { materialsSchema } from "./collections/materialsSchema";
import { balesSchema } from "./collections/balesSchema";
import { operationsSchema } from "./collections/operationsSchema";
import { tractorsSchema } from "./collections/tractorsSchema";
import { suppliersSchema } from "./collections/suppliersSchema";
import { materialPurchaseTrackingsSchema } from "./collections/materialPurchaseTrackingsSchema";
import { materialUsageTrackingsSchema } from "./collections/materialUsageTrackingsSchema";
import { fuelOperationsTrackingsSchema } from "./collections/fuelOperationsTrackingsSchema";
import {
  operationsTrackingsAdminSchema,
  operationsTrackingsAllSchema,
  operationsTrackingsFieldWorkSchema,
} from "./collections/operationsTrackingsSchema";
import { baleOrderTrackingsSchema } from "./collections/baleOrderTrackingsSchema";
import { stubSchemas } from "./collections/stubSchema";

const allSchemas: CollectionSchema[] = [
  employeesSchema,
  customersSchema,
  contractorsSchema,
  suppliersSchema,
  operationsSchema,
  materialsSchema,
  balesSchema,
  tractorsSchema,
  plotsSchema,
  agriculturalSeasonsSchema,
  fuelTanksSchema,
  materialPurchaseTrackingsSchema,
  materialUsageTrackingsSchema,
  fuelOperationsTrackingsSchema,
  operationsTrackingsAllSchema,
  operationsTrackingsFieldWorkSchema,
  operationsTrackingsAdminSchema,
  baleOrderTrackingsSchema,
  ...stubSchemas,
];

const schemasById = Object.fromEntries(
  allSchemas.map((schema) => [schema.id, schema]),
) as Record<string, CollectionSchema>;

export function getCollectionSchema(
  collectionId: string,
): CollectionSchema | undefined {
  return schemasById[collectionId];
}

export function getAllCollectionSchemas(): CollectionSchema[] {
  return allSchemas;
}
