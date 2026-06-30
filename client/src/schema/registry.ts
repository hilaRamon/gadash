import type { CollectionSchema } from "./types";
import { contractorsSchema } from "./collections/contractorsSchema";
import { moversSchema } from "./collections/moversSchema";
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
import { contractorTrackingsSchema } from "./collections/contractorTrackingsSchema";
import { transportTrackingsSchema } from "./collections/transportTrackingsSchema";
import { transportGlobalChargesSchema } from "./collections/transportGlobalChargesSchema";
import { customerBillingTrackingsSchema } from "./collections/customerBillingTrackingsSchema";
import { stubSchemas } from "./collections/stubSchema";

const allSchemas: CollectionSchema[] = [
  employeesSchema,
  customersSchema,
  contractorsSchema,
  moversSchema,
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
  contractorTrackingsSchema,
  transportTrackingsSchema,
  transportGlobalChargesSchema,
  customerBillingTrackingsSchema,
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
