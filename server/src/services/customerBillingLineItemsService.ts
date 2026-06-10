import { Types } from 'mongoose';
import { baleOrderTrackingRepository } from '../repositories/baleOrderTrackingRepository';
import { contractorTrackingRepository } from '../repositories/contractorTrackingRepository';
import { materialUsageTrackingRepository } from '../repositories/materialUsageTrackingRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import { customerBillingTrackingToApiDocument } from '../utils/customerBillingTrackingApiMapper';

function toObjectIdArray(value: unknown): Types.ObjectId[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

export async function unchargeBillingLineItems(
  billing: Record<string, unknown>,
): Promise<void> {
  const doc = customerBillingTrackingToApiDocument(billing);

  await Promise.all([
    operationTrackingRepository.markUncharged(
      toObjectIdArray(doc.operationsTrackingIds),
    ),
    contractorTrackingRepository.markUncharged(
      toObjectIdArray(doc.contractorTrackingIds),
    ),
    materialUsageTrackingRepository.markUncharged(
      toObjectIdArray(doc.materialUsageTrackingIds),
    ),
    baleOrderTrackingRepository.markUncharged(
      toObjectIdArray(doc.baleOrderTrackingIds),
    ),
  ]);
}
