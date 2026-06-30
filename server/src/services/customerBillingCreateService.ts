import type { CustomerBillRequest } from '../types/customerBill';
import type { ApiDocument } from '../types/apiDocument';
import { baleOrderTrackingRepository } from '../repositories/baleOrderTrackingRepository';
import {
  customerBillingTrackingRepository,
  type CustomerBillingTrackingInput,
} from '../repositories/customerBillingTrackingRepository';
import { contractorTrackingRepository } from '../repositories/contractorTrackingRepository';
import { materialUsageTrackingRepository } from '../repositories/materialUsageTrackingRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import { transportTrackingRepository } from '../repositories/transportTrackingRepository';
import { customerBillingTrackingToApiDocument } from '../utils/customerBillingTrackingApiMapper';
import { loadValidatedSelection } from './customerBillService';

async function markTrackingsCharged(
  selection: Awaited<ReturnType<typeof loadValidatedSelection>>,
) {
  await Promise.all([
    operationTrackingRepository.markCharged(selection.operationsTrackingIds),
    contractorTrackingRepository.markCharged(selection.contractorTrackingIds),
    materialUsageTrackingRepository.markCharged(selection.materialUsageTrackingIds),
    baleOrderTrackingRepository.markCharged(selection.baleOrderTrackingIds),
    transportTrackingRepository.markCharged(selection.transportTrackingIds),
  ]);
}

export const customerBillingCreateService = {
  async createFromSelection(body: CustomerBillRequest): Promise<ApiDocument> {
    const selection = await loadValidatedSelection(body);

    const input: CustomerBillingTrackingInput = {
      date: new Date(),
      customer: selection.customer._id,
      notes: '',
      status: 'לא אושר כלל',
      paid: false,
      finalPrice: selection.bill.total,
      operationsTrackingIds: selection.operationsTrackingIds,
      materialUsageTrackingIds: selection.materialUsageTrackingIds,
      contractorTrackingIds: selection.contractorTrackingIds,
      baleOrderTrackingIds: selection.baleOrderTrackingIds,
      transportTrackingIds: selection.transportTrackingIds,
    };

    const created = await customerBillingTrackingRepository.create(input);
    await markTrackingsCharged(selection);

    const populated = await customerBillingTrackingRepository.findById(String(created._id));
    return customerBillingTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },
};
