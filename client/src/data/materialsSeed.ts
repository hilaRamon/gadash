import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const SEED_EFFECTIVE_FROM = '2025-01-01T00:00:00.000Z'
const DEFAULT_SALE_PERCENT = 15

type MaterialSeedRow = {
  name: string
  currentQuantity: number
  currentBuyingCost: number
  amountPerDunam?: number | null
}

const materials: MaterialSeedRow[] = [
  { name: 'זרעי חיטה-דראל', currentQuantity: 0, currentBuyingCost: 0 },
  { name: 'אורגי (עשת)', currentQuantity: 45, currentBuyingCost: 37 },
  { name: 'אוקסיגל', currentQuantity: 64.5, currentBuyingCost: 39 },
  { name: 'אור', currentQuantity: 410, currentBuyingCost: 340, amountPerDunam: 0.004 },
  { name: 'אוראה לפני זריעה', currentQuantity: 3, currentBuyingCost: 2.7, amountPerDunam: 3 },
  { name: 'אוראה אחרי זריעה', currentQuantity: 3, currentBuyingCost: 2.7, amountPerDunam: 10 },
  { name: 'אורווה', currentQuantity: 616, currentBuyingCost: 0 },
  { name: 'אורז טורבו', currentQuantity: 157, currentBuyingCost: 0 },
  { name: 'אופטוס 100', currentQuantity: 45, currentBuyingCost: 34.6, amountPerDunam: 0.08 },
  { name: 'אל בועיינת', currentQuantity: 80, currentBuyingCost: 0 },
  { name: 'אל קלי אקסטרה', currentQuantity: 48, currentBuyingCost: 40.6 },
  { name: 'אלבר מ', currentQuantity: 63, currentBuyingCost: 55, amountPerDunam: 0.1 },
  { name: 'אלגרו סופר', currentQuantity: 60, currentBuyingCost: 0 },
  { name: 'באפינדן', currentQuantity: 80.5, currentBuyingCost: 0 },
  { name: 'בורגן', currentQuantity: 110, currentBuyingCost: 0 },
  { name: 'בנטון', currentQuantity: 86, currentBuyingCost: 0 },
  { name: 'גולאסו', currentQuantity: 2684, currentBuyingCost: 0 },
  { name: 'גליגן', currentQuantity: 38.5, currentBuyingCost: 39 },
  { name: 'גלנט סופר', currentQuantity: 180, currentBuyingCost: 0 },
  { name: 'דגנול', currentQuantity: 122, currentBuyingCost: 0 },
  { name: 'דופלוזן', currentQuantity: 50, currentBuyingCost: 0 },
  { name: 'דדי', currentQuantity: 760, currentBuyingCost: 680 },
  { name: "זרעי חיטה-ג'יש", currentQuantity: 3.8, currentBuyingCost: 0 },
  { name: 'זרעי חיטה-זהרה', currentQuantity: 4.8, currentBuyingCost: 3.415 },
  { name: 'זרעי חיטה-גליל', currentQuantity: 4.8, currentBuyingCost: 4.33 },
  { name: 'זרעי חיטה-יוגב', currentQuantity: 4.8, currentBuyingCost: 4.37 },
  { name: 'זרעי חיטה-יקובי', currentQuantity: 4.8, currentBuyingCost: 3.783 },
  { name: 'זרעי חיטה-עומר', currentQuantity: 4.8, currentBuyingCost: 3.98 },
  { name: 'זרעי חיטה-עמית', currentQuantity: 4.8, currentBuyingCost: 3.95 },
  { name: 'זרעי חיטה-חגב', currentQuantity: 4.8, currentBuyingCost: 3.415 },
  { name: 'זרעי חיטה-סמרי', currentQuantity: 4.8, currentBuyingCost: 3.725 },
  { name: 'זרעי שעורה-אלי', currentQuantity: 3.46, currentBuyingCost: 0 },
  { name: 'זרעי שעורה-שביב', currentQuantity: 4.8, currentBuyingCost: 4 },
  { name: 'זרעי תלתן', currentQuantity: 11, currentBuyingCost: 10 },
  { name: 'טופ גן', currentQuantity: 45, currentBuyingCost: 37.6, amountPerDunam: 0.08 },
  { name: 'טייפון', currentQuantity: 13, currentBuyingCost: 9, amountPerDunam: 0.25 },
  { name: 'טלסטאר', currentQuantity: 41, currentBuyingCost: 0 },
  { name: 'טריפל', currentQuantity: 2.96, currentBuyingCost: 2.575 },
  { name: 'טרופר סופר', currentQuantity: 1.05, currentBuyingCost: 0 },
  { name: 'מארז חיסון 0.25+אורווה 0.5', currentQuantity: 2600, currentBuyingCost: 0 },
  { name: 'מוניטור', currentQuantity: 11206, currentBuyingCost: 0 },
  { name: 'משטח פלאט', currentQuantity: 41, currentBuyingCost: 34 },
  { name: 'שטח', currentQuantity: 0, currentBuyingCost: 34, amountPerDunam: 0.015 },
  { name: 'פוליקור', currentQuantity: 82.5, currentBuyingCost: 0 },
  { name: 'פלאטון', currentQuantity: 57.5, currentBuyingCost: 0 },
  { name: 'קומפוסט', currentQuantity: 20, currentBuyingCost: 0 },
  { name: 'רקס', currentQuantity: 42, currentBuyingCost: 0 },
  { name: 'שיבולת שועל', currentQuantity: 5.45, currentBuyingCost: 0 },
]

function calcCustomerCost(cost: number, percent: number): number {
  return Number((cost * (1 + percent / 100)).toFixed(3))
}

export const materialsSeedData: CollectionDocument[] = materials.map((row, index) => ({
  _id: mockObjectId(`material-${index + 1}`),
  name: row.name,
  currentQuantity: 0,
  currentBuyingCost: row.currentBuyingCost,
  currentSalePercent: DEFAULT_SALE_PERCENT,
  amountPerDunam: row.amountPerDunam ?? null,
  customerCost: calcCustomerCost(row.currentBuyingCost, DEFAULT_SALE_PERCENT),
  pricingHistory: [
    {
      cost: row.currentBuyingCost,
      percent: DEFAULT_SALE_PERCENT,
      effectiveFrom: SEED_EFFECTIVE_FROM,
    },
  ],
}))
