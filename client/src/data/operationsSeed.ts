import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const SEED_EFFECTIVE_FROM = '2025-01-01T00:00:00.000Z'

type OperationSeedRow = {
  name: string
  currentCost: number
  pricingForm: 'דונם' | 'שעתי' | 'כמות יחידות'
  operationType: 'עיבוד' | 'מנהלה' | 'דלק'
}

const operations: OperationSeedRow[] = [
  { name: 'ארגז מיישר', currentCost: 23, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'גיבוב', currentCost: 17.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'גיבוב שני', currentCost: 17.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'דיסקוס', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'דיסקוס+ מעגלה', currentCost: 51, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'דישון', currentCost: 11.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'הכנסת זבל לחלקה', currentCost: 0, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'הכשרה', currentCost: 45.84, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'זיבול', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'זריעה', currentCost: 29, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'זריעה+אי פליחה', currentCost: 40, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'כיבוש', currentCost: 52, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'מחפרון סיקול', currentCost: 312, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { name: 'מנהלה', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
  { name: 'מעגלה', currentCost: 10, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'נסיעה ללקוח', currentCost: 350, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { name: 'סידור בלות+ העמסה ו', currentCost: 25, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'סיקול', currentCost: 750, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { name: 'פיזור קומפוסט', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'פריקה והעמסה', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'קילטור', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'קציר', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'קציר גרעין', currentCost: 80, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'ריכוז בלות בחלקה', currentCost: 15, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { name: 'ריסוס', currentCost: 15, pricingForm: 'דונם', operationType: 'עיבוד' },
  { name: 'ריסוק תמרים', currentCost: 0, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { name: 'שופל העמסה (זיבול)', currentCost: 400, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { name: 'תדלוק', currentCost: 0, pricingForm: 'דונם', operationType: 'דלק' },
  { name: 'תיקון', currentCost: 0, pricingForm: 'דונם', operationType: 'עיבוד' },
]

export const operationsSeedData: CollectionDocument[] = operations.map((row, index) => ({
  _id: mockObjectId(`operation-${index}`),
  name: row.name,
  pricingForm: row.pricingForm,
  operationType: row.operationType,
  currentCost: row.currentCost,
  costHistory: [{ cost: row.currentCost, effectiveFrom: SEED_EFFECTIVE_FROM }],
}))
