import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const names = ['מכורה', 'מלאכי השלום', 'גבעה', 'יוליוס', 'גיתית']

export const fuelTanksSeedData: CollectionDocument[] = names.map((name, index) => ({
  _id: mockObjectId(`fuel-tank-${index + 1}`),
  name,
  currentAmount: 0,
}))
