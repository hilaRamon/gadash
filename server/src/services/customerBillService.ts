import { Types } from 'mongoose';
import { BaleOrderTrackingModel } from '../models/BaleOrderTracking';
import { ContractorTrackingModel } from '../models/ContractorTracking';
import { CustomerModel } from '../models/Customer';
import { MaterialUsageTrackingModel } from '../models/MaterialUsageTracking';
import { OperationTrackingModel } from '../models/OperationTracking';
import { PlotModel } from '../models/Plot';
import { customerBillingTrackingRepository } from '../repositories/customerBillingTrackingRepository';
import type { CustomerBillDocument, CustomerBillRequest } from '../types/customerBill';
import { baleOrderTrackingToApiDocuments } from '../utils/baleOrderTrackingApiMapper';
import { contractorTrackingToApiDocuments } from '../utils/contractorTrackingApiMapper';
import {
  buildCustomerBillDocument,
  isValidBaleOrderForBill,
  isValidContractorForBill,
  isValidMaterialForBill,
  isValidOperationForBill,
} from '../utils/customerBillDataBuilder';
import { customerBillingTrackingToApiDocument } from '../utils/customerBillingTrackingApiMapper';
import { materialUsageTrackingToApiDocuments } from '../utils/materialUsageTrackingApiMapper';
import { operationTrackingToApiDocuments } from '../utils/operationTrackingApiMapper';
import {
  renderCustomerBillHtml,
  renderCustomerBillPreviewHtml,
} from '../templates/customerBillTemplate';
import { renderCustomerBillPdf } from '../utils/customerBillPdf';

const operationPopulate = {
  path: 'operation',
  select: '_id name operationType currentCost',
};
const plotPopulate = {
  path: 'plot',
  select: '_id name customer dunam',
  populate: { path: 'customer', select: '_id name' },
};
const employeePopulate = { path: 'employee', select: '_id name' };
const materialPopulate = {
  path: 'material',
  select: '_id name currentBuyingCost currentSalePercent pricingHistory',
};
const contractorPopulate = { path: 'contractor', select: '_id name' };
const contractorOperationPopulate = { path: 'operation', select: '_id name' };
const balePopulate = { path: 'bale', select: '_id name pricePerTon pricePerUnit' };
const baleCustomerPopulate = { path: 'customer', select: '_id name' };

function parseObjectIdArray(value: unknown, label: string): Types.ObjectId[] {
  if (value == null || value === '') return [];
  if (!Array.isArray(value)) {
    throw new Error(`${label} לא תקין`);
  }
  const ids = value.map((item) => String(item ?? '').trim()).filter(Boolean);
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`${label} לא תקין`);
    }
  }
  return ids.map((id) => new Types.ObjectId(id));
}

async function resolveCustomer(customerId: string): Promise<{ _id: Types.ObjectId; name: string }> {
  const id = String(customerId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('לקוח לא נמצא');
  }
  const customer = await CustomerModel.findById(id).select('_id name').lean();
  if (!customer?._id) {
    throw new Error('לקוח לא נמצא');
  }
  return {
    _id: customer._id as Types.ObjectId,
    name: String(customer.name ?? ''),
  };
}

async function customerHasMultiplePlots(customerId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(customerId)) return true;
  const count = await PlotModel.countDocuments({
    customer: new Types.ObjectId(customerId),
  });
  return count > 1;
}

export type ValidatedBillSelection = {
  customer: { _id: Types.ObjectId; name: string };
  bill: CustomerBillDocument;
  operationsTrackingIds: Types.ObjectId[];
  contractorTrackingIds: Types.ObjectId[];
  materialUsageTrackingIds: Types.ObjectId[];
  baleOrderTrackingIds: Types.ObjectId[];
};

function assertValidatedCount(
  requested: Types.ObjectId[],
  validatedCount: number,
  label: string,
): void {
  if (requested.length !== validatedCount) {
    throw new Error(`${label} לא תקינים לחיוב`);
  }
}

function formatStoredBillDate(value: unknown): string {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('he-IL');
  }
  return date.toLocaleDateString('he-IL');
}

async function fetchTrackingRowsByIds(ids: {
  operationIds: Types.ObjectId[];
  contractorIds: Types.ObjectId[];
  materialIds: Types.ObjectId[];
  baleIds: Types.ObjectId[];
}) {
  const [operationRows, contractorRows, materialRows, baleRows] = await Promise.all([
    ids.operationIds.length > 0
      ? OperationTrackingModel.find({ _id: { $in: ids.operationIds } })
          .populate(operationPopulate)
          .populate(plotPopulate)
          .populate(employeePopulate)
          .lean()
      : [],
    ids.contractorIds.length > 0
      ? ContractorTrackingModel.find({ _id: { $in: ids.contractorIds } })
          .populate(contractorPopulate)
          .populate(plotPopulate)
          .populate(contractorOperationPopulate)
          .lean()
      : [],
    ids.materialIds.length > 0
      ? MaterialUsageTrackingModel.find({ _id: { $in: ids.materialIds } })
          .populate(materialPopulate)
          .populate(plotPopulate)
          .populate(employeePopulate)
          .lean()
      : [],
    ids.baleIds.length > 0
      ? BaleOrderTrackingModel.find({ _id: { $in: ids.baleIds } })
          .populate(balePopulate)
          .populate(baleCustomerPopulate)
          .lean()
      : [],
  ]);

  return {
    operations: operationTrackingToApiDocuments(
      operationRows as Record<string, unknown>[],
    ),
    contractors: contractorTrackingToApiDocuments(
      contractorRows as Record<string, unknown>[],
    ),
    materialUsage: materialUsageTrackingToApiDocuments(
      materialRows as Record<string, unknown>[],
    ),
    baleOrders: baleOrderTrackingToApiDocuments(
      baleRows as Record<string, unknown>[],
    ),
  };
}

async function loadBillFromBillingTracking(
  billingId: string,
): Promise<{ bill: CustomerBillDocument; customerName: string }> {
  const billingRow = await customerBillingTrackingRepository.findById(billingId);
  if (!billingRow) {
    throw new Error('לא נמצא');
  }

  const billing = customerBillingTrackingToApiDocument(
    billingRow as Record<string, unknown>,
  );
  const customerName = String(billing.customerName ?? '').trim() || 'לקוח';

  const operationIds = parseObjectIdArray(
    billing.operationsTrackingIds,
    'מעקבי פעולות',
  );
  const contractorIds = parseObjectIdArray(
    billing.contractorTrackingIds,
    'מעקבי קבלנים',
  );
  const materialIds = parseObjectIdArray(
    billing.materialUsageTrackingIds,
    'מעקבי שימוש בחומרים',
  );
  const baleIds = parseObjectIdArray(
    billing.baleOrderTrackingIds,
    'מעקבי הזמנות חבילות',
  );

  const [rows, showPlots] = await Promise.all([
    fetchTrackingRowsByIds({
      operationIds,
      contractorIds,
      materialIds,
      baleIds,
    }),
    customerHasMultiplePlots(String(billing.customer ?? '')),
  ]);

  const bill = buildCustomerBillDocument({
    customerName,
    billDate: formatStoredBillDate(billing.date),
    showPlots,
    ...rows,
  });

  return { bill, customerName };
}

export async function loadValidatedSelection(
  body: CustomerBillRequest,
): Promise<ValidatedBillSelection> {
  const customer = await resolveCustomer(body.customerId);
  const customerId = String(customer._id);

  const operationIds = parseObjectIdArray(
    body.operationsTrackingIds,
    'מעקבי פעולות',
  );
  const contractorIds = parseObjectIdArray(
    body.contractorTrackingIds,
    'מעקבי קבלנים',
  );
  const materialIds = parseObjectIdArray(
    body.materialUsageTrackingIds,
    'מעקבי שימוש בחומרים',
  );
  const baleIds = parseObjectIdArray(body.baleOrderTrackingIds, 'מעקבי הזמנות חבילות');

  const totalItems =
    operationIds.length +
    contractorIds.length +
    materialIds.length +
    baleIds.length;
  if (totalItems === 0) {
    throw new Error('יש לבחור לפחות פריט אחד לחיוב');
  }

  const [fetched, showPlots] = await Promise.all([
    fetchTrackingRowsByIds({
      operationIds,
      contractorIds,
      materialIds,
      baleIds,
    }),
    customerHasMultiplePlots(customerId),
  ]);

  const operations = fetched.operations.filter((row) =>
    isValidOperationForBill(row, customerId),
  );

  const contractors = fetched.contractors.filter((row) =>
    isValidContractorForBill(row, customerId),
  );

  const materialUsage = fetched.materialUsage.filter((row) =>
    isValidMaterialForBill(row, customerId),
  );

  const baleOrders = fetched.baleOrders.filter((row) =>
    isValidBaleOrderForBill(row, customerId),
  );

  assertValidatedCount(operationIds, operations.length, 'מעקבי פעולות');
  assertValidatedCount(contractorIds, contractors.length, 'מעקבי קבלנים');
  assertValidatedCount(materialIds, materialUsage.length, 'מעקבי שימוש בחומרים');
  assertValidatedCount(baleIds, baleOrders.length, 'מעקבי הזמנות חבילות');

  const bill = buildCustomerBillDocument({
    customerName: customer.name,
    showPlots,
    operations,
    contractors,
    materialUsage,
    baleOrders,
  });

  return {
    customer,
    bill,
    operationsTrackingIds: operationIds,
    contractorTrackingIds: contractorIds,
    materialUsageTrackingIds: materialIds,
    baleOrderTrackingIds: baleIds,
  };
}

export const customerBillService = {
  async getBillPreview(body: CustomerBillRequest): Promise<{ html: string }> {
    const { bill } = await loadValidatedSelection(body);
    return { html: renderCustomerBillPreviewHtml(bill) };
  },

  async getBillPreviewForTracking(billingId: string): Promise<{ html: string }> {
    const { bill } = await loadBillFromBillingTracking(billingId);
    return { html: renderCustomerBillPreviewHtml(bill) };
  },

  async getBillPdf(body: CustomerBillRequest): Promise<Buffer> {
    const { bill } = await loadValidatedSelection(body);
    const html = renderCustomerBillHtml(bill);
    return renderCustomerBillPdf(html);
  },
};
