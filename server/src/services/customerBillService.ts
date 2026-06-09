import { Types } from 'mongoose';
import { BaleOrderTrackingModel } from '../models/BaleOrderTracking';
import { ContractorTrackingModel } from '../models/ContractorTracking';
import { CustomerModel } from '../models/Customer';
import { MaterialUsageTrackingModel } from '../models/MaterialUsageTracking';
import { OperationTrackingModel } from '../models/OperationTracking';
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

async function buildBillDocument(body: CustomerBillRequest): Promise<CustomerBillDocument> {
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

  const [operationRows, contractorRows, materialRows, baleRows] = await Promise.all([
    operationIds.length > 0
      ? OperationTrackingModel.find({ _id: { $in: operationIds } })
          .populate(operationPopulate)
          .populate(plotPopulate)
          .populate(employeePopulate)
          .lean()
      : [],
    contractorIds.length > 0
      ? ContractorTrackingModel.find({ _id: { $in: contractorIds } })
          .populate(contractorPopulate)
          .populate(plotPopulate)
          .populate(contractorOperationPopulate)
          .lean()
      : [],
    materialIds.length > 0
      ? MaterialUsageTrackingModel.find({ _id: { $in: materialIds } })
          .populate(materialPopulate)
          .populate(plotPopulate)
          .populate(employeePopulate)
          .lean()
      : [],
    baleIds.length > 0
      ? BaleOrderTrackingModel.find({ _id: { $in: baleIds } })
          .populate(balePopulate)
          .populate(baleCustomerPopulate)
          .lean()
      : [],
  ]);

  const operations = operationTrackingToApiDocuments(
    operationRows as Record<string, unknown>[],
  ).filter((row) => isValidOperationForBill(row, customerId));

  const contractors = contractorTrackingToApiDocuments(
    contractorRows as Record<string, unknown>[],
  ).filter((row) => isValidContractorForBill(row, customerId));

  const materialUsage = materialUsageTrackingToApiDocuments(
    materialRows as Record<string, unknown>[],
  ).filter((row) => isValidMaterialForBill(row, customerId));

  const baleOrders = baleOrderTrackingToApiDocuments(
    baleRows as Record<string, unknown>[],
  ).filter((row) => isValidBaleOrderForBill(row, customerId));

  return buildCustomerBillDocument({
    customerName: customer.name,
    operations,
    contractors,
    materialUsage,
    baleOrders,
  });
}

export const customerBillService = {
  async getBillPreview(body: CustomerBillRequest): Promise<{ html: string }> {
    const bill = await buildBillDocument(body);
    return { html: renderCustomerBillPreviewHtml(bill) };
  },

  async getBillPdf(body: CustomerBillRequest): Promise<Buffer> {
    const bill = await buildBillDocument(body);
    const html = renderCustomerBillHtml(bill);
    return renderCustomerBillPdf(html);
  },
};
