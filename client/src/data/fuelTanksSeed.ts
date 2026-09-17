import { mockObjectId } from "@/lib/mockObjectId"
import type { CollectionDocument } from "@/schema/types"
import { toDevName } from './devSeedName'

const names = ['מכורה', 'מלאכי השלום', 'גבעה', 'יוליוס', 'גיתית']

export const fuelTanksSeedData: CollectionDocument[] = names.map((name, index) => ({
  _id: mockObjectId(`fuel-tank-${index + 1}`),
  name: toDevName(name),
  currentAmount: 0,
}))
