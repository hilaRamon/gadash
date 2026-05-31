import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const SEED_EFFECTIVE_FROM = '2025-01-01T00:00:00.000Z'

type OperationSeedRow = {
  operationNumber: number
  name: string
  currentCost: number
  pricingForm: 'דונם' | 'שעתי' | 'כמות יחידות'
  operationType: 'עיבוד' | 'מנהלה'
}

const operations: OperationSeedRow[] = [
  { operationNumber: 263, name: 'ארגז מיישר', currentCost: 23, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 275, name: 'גיבוב', currentCost: 17.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 268, name: 'גיבוב שני', currentCost: 17.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 277, name: 'דיסקוס', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 281, name: 'דיסקוס+ מעגלה', currentCost: 51, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 265, name: 'דישון', currentCost: 11.5, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 285, name: 'הובלה', currentCost: 0, pricingForm: 'כמות יחידות', operationType: 'מנהלה' },
  { operationNumber: 304, name: 'הובלה והעמסת אוראה', currentCost: 4.42, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 302, name: 'הובלה והעמסת חומרים', currentCost: 16.5, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 286, name: 'הובלה לחלקה', currentCost: 1, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 303, name: 'הובלת פולחים והעמסה', currentCost: 15, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 300, name: 'הכנסת זבל לחלקה', currentCost: 0, pricingForm: 'כמות יחידות', operationType: 'מנהלה' },
  { operationNumber: 284, name: 'הכשרה', currentCost: 45.84, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 269, name: 'הפסקה', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
  { operationNumber: 288, name: 'השכרת טרקטור', currentCost: 1, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 290, name: 'זיבול', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 264, name: 'זריעה', currentCost: 29, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 297, name: 'זריעה+אי פליחה', currentCost: 40, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 274, name: 'כיבוש', currentCost: 52, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 267, name: 'ליווי ופיקוח עם חיו', currentCost: 1, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 295, name: 'מחפרון סיקול', currentCost: 312, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 266, name: 'מנהלה', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
  { operationNumber: 280, name: 'מעגלה', currentCost: 10, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 299, name: 'משאית', currentCost: 400, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 272, name: 'נסיעה', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
  { operationNumber: 289, name: 'נסיעה ללקוח', currentCost: 350, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 294, name: 'סידור בלות+ העמסה ו', currentCost: 25, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 292, name: 'סיקול', currentCost: 750, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 273, name: 'עבודות חוץ', currentCost: 55.5, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 291, name: 'עבודות סבבה', currentCost: 0, pricingForm: 'שעתי', operationType: 'מנהלה' },
  { operationNumber: 282, name: 'עבודות סקלי', currentCost: 46, pricingForm: 'שעתי', operationType: 'מנהלה' },
  { operationNumber: 296, name: 'פיזור קומפוסט', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 287, name: 'פריקה והעמסה', currentCost: 10, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 278, name: 'קילטור', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 276, name: 'קציר', currentCost: 46, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 298, name: 'קציר גרעין', currentCost: 80, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 283, name: 'ריכוז בלות בחלקה', currentCost: 15, pricingForm: 'כמות יחידות', operationType: 'עיבוד' },
  { operationNumber: 279, name: 'ריסוס', currentCost: 15, pricingForm: 'דונם', operationType: 'עיבוד' },
  { operationNumber: 293, name: 'ריסוק תמרים', currentCost: 0, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 301, name: 'שופל העמסה (זיבול)', currentCost: 400, pricingForm: 'שעתי', operationType: 'עיבוד' },
  { operationNumber: 271, name: 'תדלוק', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
  { operationNumber: 270, name: 'תיקון', currentCost: 0, pricingForm: 'דונם', operationType: 'מנהלה' },
]

export const operationsSeedData: CollectionDocument[] = operations.map((row) => ({
  _id: mockObjectId(`operation-${row.operationNumber}`),
  operationNumber: row.operationNumber,
  name: row.name,
  pricingForm: row.pricingForm,
  operationType: row.operationType,
  currentCost: row.currentCost,
  costHistory: [{ cost: row.currentCost, effectiveFrom: SEED_EFFECTIVE_FROM }],
}))
