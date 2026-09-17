import { mockObjectId } from "@/lib/mockObjectId"
import type { CollectionDocument } from "@/schema/types"
import { toDevName } from './devSeedName'

const names = [
  'תלתן יבש',
  'תלתן רטוב',
  'חיטה',
  'שעורה',
  'קש חיטה',
  'קש שעורה',
]

export const balesSeedData: CollectionDocument[] = names.map((name, index) => ({
  _id: mockObjectId(`bale-${index + 1}`),
  name: toDevName(name),
  pricePerTon: 0,
  pricePerUnit: 0,
}))
