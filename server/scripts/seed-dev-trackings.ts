import { Types } from 'mongoose';
import {
  CONTRACTOR_PRICING_FORMS,
  type ContractorPricingForm,
} from '../src/models/ContractorTracking';
import {
  DEFAULT_TRANSPORT_BILLING,
  TRANSPORT_CUSTOMER_BILLING,
} from '../src/models/TransportTracking';
import { baleRepository } from '../src/repositories/baleRepository';
import {
  baleOrderTrackingRepository,
  type BaleOrderTrackingInput,
} from '../src/repositories/baleOrderTrackingRepository';
import { contractorRepository } from '../src/repositories/contractorRepository';
import {
  contractorTrackingRepository,
  type ContractorTrackingInput,
} from '../src/repositories/contractorTrackingRepository';
import { customerRepository } from '../src/repositories/customerRepository';
import { employeeRepository } from '../src/repositories/employeeRepository';
import { fuelTankRepository } from '../src/repositories/fuelTankRepository';
import {
  fuelOperationTrackingRepository,
  type FuelOperationTrackingInput,
} from '../src/repositories/fuelOperationTrackingRepository';
import { moverRepository } from '../src/repositories/moverRepository';
import { operationRepository } from '../src/repositories/operationRepository';
import {
  operationTrackingRepository,
  type OperationTrackingInput,
} from '../src/repositories/operationTrackingRepository';
import { plotRepository } from '../src/repositories/plotRepository';
import { tractorRepository } from '../src/repositories/tractorRepository';
import {
  transportTrackingRepository,
  type TransportTrackingInput,
} from '../src/repositories/transportTrackingRepository';
import { calcHoursBetween, calcFinalPrice } from '../src/utils/transportTrackingPricing';
import { asObjectId, pickAt, recentSeasonDate } from './seed-lookups';

type NamedDoc = { _id: unknown; name?: unknown };
type PlotDoc = NamedDoc & {
  dunam?: unknown;
  active?: unknown;
  customer?: unknown;
};
type OperationDoc = NamedDoc & {
  operationType?: unknown;
  pricingForm?: unknown;
  currentCost?: unknown;
};

function customerIdOf(plot: PlotDoc): Types.ObjectId {
  const customer = plot.customer;
  if (customer && typeof customer === 'object' && '_id' in customer) {
    return asObjectId((customer as { _id: unknown })._id);
  }
  return asObjectId(customer);
}

function toContractorPricingForm(pricingForm: unknown): ContractorPricingForm {
  const raw = String(pricingForm ?? '');
  if (CONTRACTOR_PRICING_FORMS.includes(raw as ContractorPricingForm)) {
    return raw as ContractorPricingForm;
  }
  if (raw === 'כמות יחידות') return 'יומי';
  return 'דונם';
}

function operationAmount(
  operation: OperationDoc,
  plot: PlotDoc,
  startTime: string,
  endTime: string,
): number | null {
  const form = String(operation.pricingForm ?? 'דונם');
  if (form === 'שעתי') {
    return calcHoursBetween(startTime, endTime);
  }
  if (form === 'כמות יחידות') {
    return 4;
  }
  const dunam = Number(plot.dunam);
  return Number.isFinite(dunam) && dunam > 0 ? dunam : 10;
}

export async function seedDevTrackingsIntoDb(): Promise<{
  operations: number;
  contractors: number;
  transports: number;
  baleOrders: number;
  fuel: number;
}> {
  const [
    plotsRaw,
    operationsRaw,
    employees,
    contractors,
    movers,
    customers,
    bales,
    fuelTanks,
    tractors,
  ] = await Promise.all([
    plotRepository.findAll(),
    operationRepository.findAll(),
    employeeRepository.findAll(),
    contractorRepository.findAll(),
    moverRepository.findAll(),
    customerRepository.findAll(),
    baleRepository.findAll(),
    fuelTankRepository.findAll(),
    tractorRepository.findAll(),
  ]);

  const plots = (plotsRaw as PlotDoc[]).filter(
    (plot) => plot.active !== false && plot.customer != null,
  );
  const fieldOps = (operationsRaw as OperationDoc[]).filter(
    (operation) => String(operation.operationType ?? '') === 'עיבוד',
  );
  const fuelOp = (operationsRaw as OperationDoc[]).find(
    (operation) => String(operation.operationType ?? '') === 'דלק',
  );

  if (plots.length === 0) throw new Error('No plots in DB');
  if (fieldOps.length === 0) throw new Error('No field operations in DB');
  if (employees.length === 0) throw new Error('No employees in DB');
  if (contractors.length === 0) throw new Error('No contractors in DB');
  if (movers.length === 0) throw new Error('No movers in DB');
  if (customers.length === 0) throw new Error('No customers in DB');
  if (bales.length === 0) throw new Error('No bales in DB');
  if (fuelTanks.length === 0) throw new Error('No fuel tanks in DB');
  if (tractors.length === 0) throw new Error('No tractors in DB');
  if (!fuelOp) throw new Error('No fuel operation (תדלוק) in DB');

  const timeSlots: Array<[string, string]> = [
    ['06:00', '09:30'],
    ['07:00', '12:00'],
    ['08:00', '11:15'],
    ['13:00', '17:00'],
    ['14:30', '18:00'],
  ];

  const operationRows: OperationTrackingInput[] = Array.from({ length: 12 }, (_, i) => {
    const plot = pickAt(plots, i);
    const operation = pickAt(fieldOps, i);
    const employee = pickAt(employees, i);
    const [startTime, endTime] = pickAt(timeSlots, i);
    const amount = operationAmount(operation, plot, startTime, endTime);
    const unitCost = Number(operation.currentCost ?? 0);
    return {
      date: recentSeasonDate(i),
      operation: asObjectId(operation._id),
      plot: asObjectId(plot._id),
      employee: asObjectId(employee._id),
      startTime,
      endTime,
      notes: i % 3 === 0 ? 'מעקב דוגמה' : '',
      billable: i !== 4,
      wasCharged: false,
      amount,
      unitCost: Number.isFinite(unitCost) ? unitCost : 0,
    };
  });

  const contractorRows: ContractorTrackingInput[] = Array.from({ length: 10 }, (_, i) => {
    const plot = pickAt(plots, i + 1);
    const operation = pickAt(fieldOps, i + 2);
    const contractor = pickAt(contractors, i);
    const pricingForm = toContractorPricingForm(operation.pricingForm);
    const [startTime, endTime] = pickAt(timeSlots, i);
    const unitPrice = 80 + i * 5;
    const unitAmount =
      pricingForm === 'שעתי'
        ? calcHoursBetween(startTime, endTime)
        : pricingForm === 'יומי'
          ? 1
          : Number(plot.dunam) || 10;
    return {
      date: recentSeasonDate(i + 1),
      contractor: asObjectId(contractor._id),
      plot: asObjectId(plot._id),
      operation: asObjectId(operation._id),
      pricingForm,
      startTime: pricingForm === 'שעתי' ? startTime : null,
      endTime: pricingForm === 'שעתי' ? endTime : null,
      unitPrice,
      unitAmount,
      unitCustomerPrice: Number((unitPrice * 1.2).toFixed(2)),
      notes: '',
      wasCharged: false,
    };
  });

  const transportRows: TransportTrackingInput[] = Array.from({ length: 10 }, (_, i) => {
    const mover = pickAt(movers, i);
    const plot = pickAt(plots, i);
    const [startTime, endTime] = pickAt(timeSlots, i);
    const hours = calcHoursBetween(startTime, endTime);
    const hourlyRate = 180;
    const customerHourlyRate = 220;
    const billToCustomer = i % 2 === 0;
    return {
      date: recentSeasonDate(i),
      mover: asObjectId(mover._id),
      startTime,
      endTime,
      hourlyRate,
      customerHourlyRate,
      hours,
      finalPrice: calcFinalPrice(hourlyRate, hours),
      billing: billToCustomer ? TRANSPORT_CUSTOMER_BILLING : DEFAULT_TRANSPORT_BILLING,
      customer: billToCustomer ? customerIdOf(plot) : null,
      notes: billToCustomer ? 'חיוב ללקוח — דוגמה' : '',
      wasCharged: false,
    };
  });

  const baleOrderRows: BaleOrderTrackingInput[] = Array.from({ length: 8 }, (_, i) => {
    const bale = pickAt(bales, i);
    const customer = pickAt(customers, i);
    const byWeight = i % 2 === 0;
    return {
      date: recentSeasonDate(i + 2),
      bale: asObjectId(bale._id),
      customer: asObjectId(customer._id),
      quantity: 12 + i * 2,
      pricingForm: byWeight ? 'לפי משקל' : 'לפי יחידות',
      pricePerTon: 850,
      pricePerUnit: 18,
      weight: byWeight ? 4.5 + i * 0.4 : null,
      transportPrice: i % 3 === 0 ? 250 : null,
      weighed: byWeight,
      wasCharged: false,
      notes: '',
    };
  });

  const fuelRows: FuelOperationTrackingInput[] = Array.from({ length: 8 }, (_, i) => {
    const tank = pickAt(fuelTanks, i);
    const tractor = pickAt(tractors, i);
    const employee = pickAt(employees, i + 3);
    return {
      date: recentSeasonDate(i),
      operation: asObjectId(fuelOp._id),
      fuelTank: asObjectId(tank._id),
      amount: 40 + i * 8,
      tractor: tractor ? asObjectId(tractor._id) : null,
      employee: asObjectId(employee._id),
      notes: '',
    };
  });

  await Promise.all([
    operationTrackingRepository.deleteAll(),
    contractorTrackingRepository.deleteAll(),
    transportTrackingRepository.deleteAll(),
    baleOrderTrackingRepository.deleteAll(),
    fuelOperationTrackingRepository.deleteAll(),
  ]);

  await Promise.all([
    operationTrackingRepository.insertMany(operationRows),
    contractorTrackingRepository.insertMany(contractorRows),
    transportTrackingRepository.insertMany(transportRows),
    baleOrderTrackingRepository.insertMany(baleOrderRows),
    fuelOperationTrackingRepository.insertMany(fuelRows),
  ]);

  return {
    operations: operationRows.length,
    contractors: contractorRows.length,
    transports: transportRows.length,
    baleOrders: baleOrderRows.length,
    fuel: fuelRows.length,
  };
}
