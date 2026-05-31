import { plotsSeedRows } from '../../client/src/data/plotsSeed';
import { resolvePlotCustomerName } from '../../client/src/data/plotCustomerAliases';
import { customerRepository } from '../src/repositories/customerRepository';
import { plotRepository } from '../src/repositories/plotRepository';
import type { PlotInput } from '../src/repositories/plotRepository';

export async function seedPlotsIntoDb(): Promise<number> {
  const rows: PlotInput[] = [];
  const missingCustomers: string[] = [];

  for (const row of plotsSeedRows) {
    const customerName = resolvePlotCustomerName(row.customerName);
    const customer = await customerRepository.findByName(customerName);

    if (!customer?._id) {
      missingCustomers.push(`${row.customerName} -> ${customerName}`);
      continue;
    }

    rows.push({
      plotNumber: row.plotNumber,
      name: row.name,
      customer: customer._id as PlotInput['customer'],
      dunam: row.dunam,
      plotType: row.plotType,
      active: row.active,
    });
  }

  if (missingCustomers.length > 0) {
    throw new Error(
      `Customers not found in DB:\n${[...new Set(missingCustomers)].join('\n')}`,
    );
  }

  await plotRepository.deleteAll();
  await plotRepository.insertMany(rows);
  return rows.length;
}
