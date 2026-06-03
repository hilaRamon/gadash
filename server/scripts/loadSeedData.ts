import { contractorsSeedData } from '../../client/src/data/contractorsSeed';
import { moversSeedData } from '../../client/src/data/moversSeed';
import { customersSeedData } from '../../client/src/data/customersSeed';
import { employeesSeedData } from '../../client/src/data/employeesSeed';
import { plotsSeedRows } from '../../client/src/data/plotsSeed';
import { agriculturalSeasonsSeedData } from '../../client/src/data/agriculturalSeasonsSeed';
import { fuelTanksSeedData } from '../../client/src/data/fuelTanksSeed';
import { materialsSeedData } from '../../client/src/data/materialsSeed';
import { balesSeedData } from '../../client/src/data/balesSeed';
import { operationsSeedData } from '../../client/src/data/operationsSeed';
import { tractorsSeedData } from '../../client/src/data/tractorsSeed';
import { suppliersSeedData } from '../../client/src/data/suppliersSeed';
import { materialPurchaseTrackingsSeedData } from '../../client/src/data/materialPurchaseTrackingsSeed';
import { materialUsageTrackingsSeedData } from '../../client/src/data/materialUsageTrackingsSeed';
import type { ApiDocument } from '../src/types/apiDocument';

export function loadContractorsSeed(): ApiDocument[] {
  return contractorsSeedData;
}

export function loadMoversSeed(): ApiDocument[] {
  return moversSeedData;
}

export function loadCustomersSeed(): ApiDocument[] {
  return customersSeedData;
}

export function loadEmployeesSeed(): ApiDocument[] {
  return employeesSeedData;
}

export function loadTractorsSeed(): ApiDocument[] {
  return tractorsSeedData;
}

export function loadSuppliersSeed(): ApiDocument[] {
  return suppliersSeedData;
}

export function loadOperationsSeed(): ApiDocument[] {
  return operationsSeedData;
}

export function loadMaterialsSeed(): ApiDocument[] {
  return materialsSeedData;
}

export function loadBalesSeed(): ApiDocument[] {
  return balesSeedData;
}

export function loadAgriculturalSeasonsSeed(): ApiDocument[] {
  return agriculturalSeasonsSeedData;
}

export function loadFuelTanksSeed(): ApiDocument[] {
  return fuelTanksSeedData;
}

export function loadPlotsSeedRows() {
  return plotsSeedRows;
}

export function loadMaterialPurchaseTrackingsSeed(): ApiDocument[] {
  return materialPurchaseTrackingsSeedData;
}

export function loadMaterialUsageTrackingsSeed(): ApiDocument[] {
  return materialUsageTrackingsSeedData;
}
