import { employeeRepository } from '../src/repositories/employeeRepository';
import { materialRepository } from '../src/repositories/materialRepository';
import { plotRepository } from '../src/repositories/plotRepository';
import { supplierRepository } from '../src/repositories/supplierRepository';
import type { MaterialPurchaseTrackingInput } from '../src/repositories/materialPurchaseTrackingRepository';
import type { MaterialUsageTrackingInput } from '../src/repositories/materialUsageTrackingRepository';
import {
  loadMaterialPurchaseTrackingsSeed,
  loadMaterialUsageTrackingsSeed,
} from './loadSeedData';
import { asObjectId, recentSeasonDate, requireByName } from './seed-lookups';

export async function resolveMaterialPurchaseTrackings(): Promise<
  MaterialPurchaseTrackingInput[]
> {
  const [materials, suppliers] = await Promise.all([
    materialRepository.findAll(),
    supplierRepository.findAll(),
  ]);

  return loadMaterialPurchaseTrackingsSeed().map((row, index) => {
    const material = requireByName(materials, String(row.materialName ?? ''), 'Material');
    const supplier = requireByName(suppliers, String(row.supplierName ?? ''), 'Supplier');
    return {
      date: recentSeasonDate(index),
      material: asObjectId(material._id),
      supplier: asObjectId(supplier._id),
      unitPrice: Number(row.unitPrice),
      amount: Number(row.amount),
      finalPrice: Number(row.finalPrice),
      notes: String(row.notes ?? ''),
    };
  });
}

export async function resolveMaterialUsageTrackings(): Promise<
  MaterialUsageTrackingInput[]
> {
  const [materials, plots, employees] = await Promise.all([
    materialRepository.findAll(),
    plotRepository.findAll(),
    employeeRepository.findAll(),
  ]);

  return loadMaterialUsageTrackingsSeed().map((row, index) => {
    const material = requireByName(materials, String(row.materialName ?? ''), 'Material');
    const plot = requireByName(plots, String(row.plotName ?? ''), 'Plot');
    const employee = requireByName(employees, String(row.employeeName ?? ''), 'Employee');
    return {
      date: recentSeasonDate(index),
      material: asObjectId(material._id),
      plot: asObjectId(plot._id),
      employee: asObjectId(employee._id),
      amount: Number(row.amount),
      notes: String(row.notes ?? ''),
      billable: row.billable === false ? false : true,
      wasCharged: false,
    };
  });
}
