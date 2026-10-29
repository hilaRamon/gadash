import { materialUsageTrackingRepository } from '../repositories/materialUsageTrackingRepository';
import { calcCustomerCost } from '../utils/materialPricing';
import { dunamAmountsMatch } from '../utils/operationTrackingPricing';

export type MaterialCustomerCostSnapshot = {
  id: string;
  previousBuyingCost: number;
  previousSalePercent: number;
};

export async function syncUnchargedMaterialUsagePrices(options: {
  materials: MaterialCustomerCostSnapshot[];
  nextBuyingCost: number;
  nextSalePercent: number;
  session?: unknown;
}): Promise<void> {
  const nextCustomerCost = calcCustomerCost(
    options.nextBuyingCost,
    options.nextSalePercent,
  );

  for (const material of options.materials) {
    const previousCustomerCost = calcCustomerCost(
      material.previousBuyingCost,
      material.previousSalePercent,
    );
    if (dunamAmountsMatch(previousCustomerCost, nextCustomerCost)) continue;

    await materialUsageTrackingRepository.syncUnchargedUnitPricesForMaterialCost({
      materialId: material.id,
      nextCost: nextCustomerCost,
      session: options.session,
    });
  }
}
