import type { CollectionListConfig, ListFieldDef } from './mongoListFilter'

function fields(...defs: ListFieldDef[]): ListFieldDef[] {
  return defs
}

function str(key: string, path = key): ListFieldDef {
  return { key, path, kind: 'string' }
}

function num(key: string, path = key): ListFieldDef {
  return { key, path, kind: 'number' }
}

function bool(key: string, path = key): ListFieldDef {
  return { key, path, kind: 'boolean' }
}

function date(key: string, path = key): ListFieldDef {
  return { key, path, kind: 'date' }
}

function ref(
  key: string,
  path: string,
  refModel: string,
  refNameField = 'name',
): ListFieldDef {
  return { key, path, kind: 'ref', refModel, refNameField }
}

const nameEmailMobileNotes = fields(
  str('name'),
  str('email'),
  str('mobile'),
  str('notes'),
)

export const collectionListConfigs: Record<string, CollectionListConfig> = {
  employees: {
    searchFields: ['name', 'email', 'mobile', 'notes'],
    fields: nameEmailMobileNotes,
    defaultSort: { name: 1 },
    sortFields: { name: 'name', email: 'email', mobile: 'mobile' },
  },
  customers: {
    searchFields: ['name', 'email', 'mobile', 'notes'],
    fields: nameEmailMobileNotes,
    defaultSort: { name: 1 },
    sortFields: { name: 'name', email: 'email', mobile: 'mobile' },
  },
  contractors: {
    searchFields: ['name', 'email', 'mobile', 'notes'],
    fields: nameEmailMobileNotes,
    defaultSort: { name: 1 },
    sortFields: { name: 'name', email: 'email', mobile: 'mobile' },
  },
  movers: {
    searchFields: ['name', 'email', 'mobile', 'notes'],
    fields: nameEmailMobileNotes,
    defaultSort: { name: 1 },
    sortFields: { name: 'name', email: 'email', mobile: 'mobile' },
  },
  suppliers: {
    searchFields: ['name', 'email', 'mobile', 'notes'],
    fields: nameEmailMobileNotes,
    defaultSort: { name: 1 },
    sortFields: { name: 'name', email: 'email', mobile: 'mobile' },
  },
  operations: {
    searchFields: ['name', 'notes'],
    fields: fields(
      str('name'),
      str('notes'),
      str('operationType'),
      str('pricingForm'),
      num('currentCost'),
    ),
    defaultSort: { name: 1 },
    sortFields: {
      name: 'name',
      operationType: 'operationType',
      currentCost: 'currentCost',
    },
  },
  materials: {
    searchFields: ['name', 'inventoryGroup'],
    fields: fields(
      str('name'),
      str('inventoryGroup'),
      num('amountPerDunam'),
      num('currentQuantity'),
      num('currentBuyingCost'),
      num('currentSalePercent'),
    ),
    defaultSort: { name: 1 },
    sortFields: {
      name: 'name',
      currentQuantity: 'currentQuantity',
      currentBuyingCost: 'currentBuyingCost',
    },
  },
  bales: {
    searchFields: ['name'],
    fields: fields(str('name'), num('pricePerTon'), num('pricePerUnit')),
    defaultSort: { name: 1 },
    sortFields: {
      name: 'name',
      pricePerTon: 'pricePerTon',
      pricePerUnit: 'pricePerUnit',
    },
  },
  tractors: {
    searchFields: ['name'],
    fields: fields(str('name')),
    defaultSort: { name: 1 },
    sortFields: { name: 'name' },
  },
  plots: {
    searchFields: ['name'],
    fields: fields(
      str('name'),
      num('dunam'),
      bool('active'),
      ref('customer', 'customer', 'Customer'),
    ),
    defaultSort: { name: 1 },
    sortFields: { name: 'name', dunam: 'dunam', active: 'active' },
  },
  fuelTanks: {
    searchFields: ['name'],
    fields: fields(str('name'), num('currentAmount')),
    defaultSort: { name: 1 },
    sortFields: { name: 'name', currentAmount: 'currentAmount' },
  },
  agriculturalSeasons: {
    searchFields: ['year'],
    fields: fields(num('year'), date('startDate'), date('endDate')),
    defaultSort: { year: -1 },
    sortFields: { year: 'year', startDate: 'startDate', endDate: 'endDate' },
  },
  operationsTrackings: {
    searchFields: ['operation', 'plot', 'employee', 'notes', 'startTime', 'endTime'],
    fields: fields(
      date('date'),
      ref('operation', 'operation', 'Operation'),
      ref('plot', 'plot', 'Plot'),
      ref('employee', 'employee', 'Employee'),
      str('startTime'),
      str('endTime'),
      str('notes'),
      num('amount'),
      bool('billable'),
      bool('wasCharged'),
    ),
    defaultSort: { date: -1 },
    sortFields: {
      date: 'date',
      amount: 'amount',
      billable: 'billable',
      startTime: 'startTime',
      endTime: 'endTime',
    },
  },
  materialUsageTrackings: {
    searchFields: ['material', 'plot', 'employee', 'notes'],
    fields: fields(
      date('date'),
      ref('material', 'material', 'Material'),
      ref('plot', 'plot', 'Plot'),
      ref('employee', 'employee', 'Employee'),
      str('notes'),
      num('amount'),
      bool('billable'),
      bool('wasCharged'),
    ),
    defaultSort: { date: -1 },
    sortFields: { date: 'date', amount: 'amount', billable: 'billable' },
  },
  materialPurchaseTrackings: {
    searchFields: ['material', 'supplier', 'notes'],
    fields: fields(
      date('date'),
      ref('material', 'material', 'Material'),
      ref('supplier', 'supplier', 'Supplier'),
      str('notes'),
      num('amount'),
      num('unitPrice'),
      num('finalPrice'),
    ),
    defaultSort: { date: -1 },
    sortFields: {
      date: 'date',
      amount: 'amount',
      unitPrice: 'unitPrice',
      finalPrice: 'finalPrice',
    },
  },
  fuelOperationsTrackings: {
    searchFields: ['operation', 'employee', 'tractor', 'fuelTank', 'notes'],
    fields: fields(
      date('date'),
      ref('operation', 'operation', 'Operation'),
      ref('employee', 'employee', 'Employee'),
      ref('tractor', 'tractor', 'Tractor'),
      ref('fuelTank', 'fuelTank', 'FuelTank'),
      str('notes'),
      num('amount'),
    ),
    defaultSort: { date: -1 },
    sortFields: { date: 'date', amount: 'amount' },
  },
  contractorTrackings: {
    searchFields: ['contractor', 'plot', 'operation', 'notes'],
    fields: fields(
      date('date'),
      ref('contractor', 'contractor', 'Contractor'),
      ref('plot', 'plot', 'Plot'),
      ref('operation', 'operation', 'Operation'),
      str('notes'),
      num('amount'),
      bool('billable'),
      bool('wasCharged'),
    ),
    defaultSort: { date: -1 },
    sortFields: { date: 'date', amount: 'amount', billable: 'billable' },
  },
  transportTrackings: {
    searchFields: ['mover', 'customer', 'notes'],
    fields: fields(
      date('date'),
      ref('mover', 'mover', 'Mover'),
      ref('customer', 'customer', 'Customer'),
      str('notes'),
      str('billing'),
      num('hourlyRate'),
      num('hours'),
      num('finalPrice'),
      bool('wasCharged'),
    ),
    defaultSort: { date: -1 },
    sortFields: {
      date: 'date',
      hourlyRate: 'hourlyRate',
      hours: 'hours',
      finalPrice: 'finalPrice',
      billing: 'billing',
    },
  },
  transportGlobalCharges: {
    searchFields: ['notes'],
    fields: fields(
      date('executedAt'),
      num('seasonYear'),
      str('notes'),
      str('status'),
    ),
    defaultSort: { executedAt: -1 },
    sortFields: {
      executedAt: 'executedAt',
      seasonYear: 'seasonYear',
      status: 'status',
    },
  },
  baleOrderTrackings: {
    searchFields: ['customer', 'bale', 'notes'],
    fields: fields(
      date('date'),
      ref('customer', 'customer', 'Customer'),
      ref('bale', 'bale', 'Bale'),
      str('notes'),
      num('amount'),
      bool('billable'),
      bool('wasCharged'),
    ),
    defaultSort: { date: -1 },
    sortFields: { date: 'date', amount: 'amount', billable: 'billable' },
  },
  customerBillingTrackings: {
    searchFields: ['customer', 'notes'],
    fields: fields(
      date('date'),
      ref('customer', 'customer', 'Customer'),
      str('notes'),
      str('status'),
      num('finalPrice'),
      bool('paid'),
    ),
    defaultSort: { date: -1 },
    sortFields: {
      date: 'date',
      finalPrice: 'finalPrice',
      paid: 'paid',
      status: 'status',
    },
  },
  invoices: {
    searchFields: ['invoiceNumber', 'companyName', 'notes'],
    fields: fields(
      date('date'),
      str('invoiceNumber'),
      str('companyName'),
      num('amount'),
      date('dueDate'),
      bool('paid'),
      str('notes'),
    ),
    defaultSort: { date: -1 },
    sortFields: {
      date: 'date',
      amount: 'amount',
      dueDate: 'dueDate',
      paid: 'paid',
    },
  },
}

export function getCollectionListConfig(
  collection: string,
): CollectionListConfig | undefined {
  return collectionListConfigs[collection]
}
