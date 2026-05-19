import { mockObjectId } from '../lib/mockObjectId'
import { customersSeedData } from './customersSeed'
import { resolvePlotCustomerName } from './plotCustomerAliases'
import type { CollectionDocument } from '../schema/types'

export type PlotSeedRow = {
  plotNumber: number
  name: string
  customerName: string
  dunam: number
  plotType: 'הר' | 'בקעה' | null
  active: boolean
}

export const plotsSeedRows: PlotSeedRow[] = [
  { plotNumber: 67, name: 'אביחי ינון', customerName: 'אביחי (אליה) ינון', dunam: 50, plotType: 'בקעה', active: true },
  { plotNumber: 86, name: 'אביתר קארו', customerName: 'אביתר קארו', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 75, name: 'אברהם דורי', customerName: 'אברהם דורי', dunam: 20, plotType: 'בקעה', active: true },
  { plotNumber: 70, name: 'אור ציון משולמי', customerName: 'אור ציון משולמי', dunam: 50, plotType: 'הר', active: true },
  { plotNumber: 78, name: 'אורי נועם', customerName: 'אורי נועם', dunam: 30, plotType: 'בקעה', active: true },
  { plotNumber: 22, name: 'אורי-אום זוקא', customerName: 'אורי כהן', dunam: 130, plotType: 'בקעה', active: true },
  { plotNumber: 27, name: 'איתמר חדש', customerName: 'איתמר כהן', dunam: 50, plotType: 'בקעה', active: false },
  { plotNumber: 46, name: 'איתמר בהן- כל החלקות', customerName: 'איתמר כהן', dunam: 281, plotType: 'בקעה', active: true },
  { plotNumber: 16, name: 'איתמר- כניסה', customerName: 'איתמר כהן', dunam: 29, plotType: 'הר', active: false },
  { plotNumber: 20, name: 'איתמר- מטווח תחתון', customerName: 'איתמר כהן', dunam: 40.1, plotType: 'בקעה', active: false },
  { plotNumber: 17, name: 'איתמר- נחשון', customerName: 'איתמר כהן', dunam: 19, plotType: 'בקעה', active: false },
  { plotNumber: 18, name: 'איתמר- שדה ירוק', customerName: 'איתמר כהן', dunam: 29, plotType: 'בקעה', active: false },
  { plotNumber: 19, name: 'איתמר-מטווח עליון', customerName: 'איתמר כהן', dunam: 18, plotType: 'בקעה', active: false },
  { plotNumber: 72, name: 'אלישע טורנר', customerName: 'אלישע טורנר', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 99, name: 'אלעד חוות אביה', customerName: 'אלעד חוות אביה', dunam: 45, plotType: 'בקעה', active: true },
  { plotNumber: 90, name: 'אסף אזולאי עדי עד', customerName: 'אסף אזולאי', dunam: 110, plotType: 'הר', active: true },
  { plotNumber: 79, name: 'אסף אזולאי-כוכב השחר', customerName: 'אסף אזולאי', dunam: 45, plotType: 'הר', active: true },
  { plotNumber: 34, name: 'אריאל מעל אדומים', customerName: 'אריאל גרילניק', dunam: 20, plotType: 'הר', active: true },
  { plotNumber: 2, name: 'גבעה ואדי', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 35.5, plotType: 'הר', active: false },
  { plotNumber: 1, name: 'גבעה עליון', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 59.4, plotType: 'הר', active: false },
  { plotNumber: 45, name: 'גבעה עליונה+ גבעת ואדי', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 100, plotType: 'הר', active: true },
  { plotNumber: 43, name: 'גבעות עולם', customerName: 'חוות גבעות עולם', dunam: 250, plotType: 'הר', active: true },
  { plotNumber: 98, name: 'גבעות עולם בקיה', customerName: 'חוות גבעות עולם', dunam: 115, plotType: 'הר', active: true },
  { plotNumber: 97, name: 'גבעות עולם שיבולת', customerName: 'חוות גבעות עולם', dunam: 45, plotType: 'הר', active: true },
  { plotNumber: 53, name: 'גבעות עולם-אורגני', customerName: 'חוות גבעות עולם', dunam: 90, plotType: 'הר', active: true },
  { plotNumber: 61, name: 'גדי', customerName: 'מקנה הרים', dunam: 66, plotType: 'בקעה', active: true },
  { plotNumber: 62, name: 'גיתית', customerName: 'מקנה הרים', dunam: 600, plotType: 'בקעה', active: true },
  { plotNumber: 38, name: 'גקסון גיתית', customerName: 'משק סנה (נועם ג\'קסון)', dunam: 160, plotType: 'בקעה', active: true },
  { plotNumber: 41, name: 'דידי ליד משכיות', customerName: 'דוד הרצליך', dunam: 40, plotType: 'בקעה', active: true },
  { plotNumber: 59, name: 'זור', customerName: 'מקנה הרים', dunam: 165, plotType: 'בקעה', active: true },
  { plotNumber: 60, name: 'זור חמרה', customerName: 'מקנה הרים', dunam: 89, plotType: 'בקעה', active: true },
  { plotNumber: 51, name: 'זור מכורה', customerName: 'מקנה הרים', dunam: 1, plotType: 'בקעה', active: true },
  { plotNumber: 71, name: 'חוות מגדי', customerName: 'חוות מגדי (יוסף חיים מגדי)', dunam: 1, plotType: 'בקעה', active: true },
  { plotNumber: 50, name: 'חלקה קוקו', customerName: 'מקנה הרים', dunam: 10, plotType: 'הר', active: true },
  { plotNumber: 82, name: 'חמרה ואדי', customerName: 'מקנה הרים', dunam: 40, plotType: 'בקעה', active: true },
  { plotNumber: 11, name: 'חמרה מזרח', customerName: 'מקנה הרים', dunam: 137.6, plotType: 'בקעה', active: true },
  { plotNumber: 12, name: 'חמרה צפון צפון קרוב', customerName: 'מקנה הרים', dunam: 100.8, plotType: 'בקעה', active: true },
  { plotNumber: 13, name: 'חמרה צפון צפון רחוק', customerName: 'מקנה הרים', dunam: 135.4, plotType: 'בקעה', active: true },
  { plotNumber: 85, name: 'חן בן אליהו', customerName: 'חן בן אליהו', dunam: 20, plotType: 'הר', active: true },
  { plotNumber: 49, name: 'טירת צבי', customerName: 'טירת צבי', dunam: 1, plotType: null, active: true },
  { plotNumber: 80, name: 'יונתן בוצר', customerName: 'יונתן בוצר', dunam: 180, plotType: null, active: true },
  { plotNumber: 81, name: 'ינון כהן', customerName: 'ינון כהן', dunam: 50, plotType: 'בקעה', active: true },
  { plotNumber: 42, name: 'ישי בראון קבלנות', customerName: 'י.בראון עיבודים בע"מ', dunam: 1, plotType: null, active: true },
  { plotNumber: 94, name: 'ישי לוי', customerName: 'ישי לוי', dunam: 80, plotType: 'בקעה', active: true },
  { plotNumber: 33, name: 'כלל החלפות', customerName: 'מקנה הרים', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 35, name: 'ליעוז - בכביש', customerName: 'ג\'יי.איי.רון בע"מ (ליעוז)', dunam: 262.3, plotType: null, active: true },
  { plotNumber: 91, name: 'לירון גרוס', customerName: 'לירון גרוס', dunam: 130, plotType: 'בקעה', active: true },
  { plotNumber: 92, name: 'לירון שמשוביץ חמרה', customerName: 'לירון שמשוביץ חמרה', dunam: 50, plotType: 'בקעה', active: true },
  { plotNumber: 87, name: 'שביה', customerName: 'מקנה הרים', dunam: 80, plotType: 'הר', active: true },
  { plotNumber: 63, name: 'מודיעין', customerName: 'מקנה הרים', dunam: 230, plotType: null, active: true },
  { plotNumber: 74, name: 'מיכאל שלמה', customerName: 'מיכאל שלמה', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 58, name: 'מיכה סודאי', customerName: 'מיכה סודאי', dunam: 1, plotType: null, active: true },
  { plotNumber: 8, name: 'מכורה אנטנה', customerName: 'מקנה הרים', dunam: 252.2, plotType: 'בקעה', active: true },
  { plotNumber: 5, name: 'מכורה גבוהה', customerName: 'מקנה הרים', dunam: 126.8, plotType: 'בקעה', active: true },
  { plotNumber: 4, name: 'מכורה דקלים', customerName: 'מקנה הרים', dunam: 45, plotType: 'בקעה', active: true },
  { plotNumber: 7, name: 'מכורה הר', customerName: 'מקנה הרים', dunam: 200, plotType: 'בקעה', active: true },
  { plotNumber: 6, name: 'מכורה ישוב', customerName: 'מקנה הרים', dunam: 80, plotType: 'בקעה', active: true },
  { plotNumber: 3, name: 'מכורה בכביש', customerName: 'מקנה הרים', dunam: 175, plotType: 'בקעה', active: true },
  { plotNumber: 25, name: 'מכורה סטס', customerName: 'מקנה הרים', dunam: 184, plotType: null, active: true },
  { plotNumber: 24, name: 'מכורה פרדס', customerName: 'מקנה הרים', dunam: 98.8, plotType: 'בקעה', active: true },
  { plotNumber: 9, name: 'מכורה צפון', customerName: 'מקנה הרים', dunam: 350.8, plotType: 'בקעה', active: true },
  { plotNumber: 28, name: 'מכורה רחוק', customerName: 'מקנה הרים', dunam: 86.5, plotType: 'בקעה', active: true },
  { plotNumber: 10, name: 'מכורה תחתון', customerName: 'מקנה הרים', dunam: 136, plotType: 'בקעה', active: true },
  { plotNumber: 83, name: 'מכירת סחורה', customerName: 'מכירת סחורה', dunam: 1111, plotType: 'בקעה', active: true },
  { plotNumber: 95, name: 'מכירת סחורה', customerName: 'מכירת סחורה', dunam: 1, plotType: null, active: true },
  { plotNumber: 64, name: 'מלאכי השלום', customerName: 'ליבי בניה ותשתיות בע"מ', dunam: 737, plotType: 'בקעה', active: true },
  { plotNumber: 31, name: 'מנחם', customerName: 'מנחם גושן', dunam: 40, plotType: 'בקעה', active: true },
  { plotNumber: 52, name: 'משה שרביט', customerName: 'משה שרביט', dunam: 60, plotType: 'בקעה', active: true },
  { plotNumber: 14, name: 'משק אחיה', customerName: 'משק אחיה', dunam: 147, plotType: 'הר', active: true },
  { plotNumber: 57, name: 'משק סנה', customerName: 'משק סנה (נועם ג\'קסון)', dunam: 1, plotType: null, active: false },
  { plotNumber: 73, name: 'משק שדה (מרדכי שדה)', customerName: 'משק שדה (מרדכי שדה)', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 40, name: 'נגרייה', customerName: 'גבע ברקן תעשיות מתקדמות בע"מ', dunam: 1, plotType: null, active: true },
  { plotNumber: 47, name: 'ניסים עידן', customerName: 'ניסים עידן', dunam: 33, plotType: 'הר', active: true },
  { plotNumber: 56, name: 'נריה בן פזי', customerName: 'נריה בן פזי', dunam: 180, plotType: null, active: true },
  { plotNumber: 96, name: 'נתי 35', customerName: 'נתי שולב', dunam: 35, plotType: 'הר', active: true },
  { plotNumber: 21, name: 'נתי- עמק ממגד', customerName: 'נתי שולב', dunam: 124, plotType: 'הר', active: true },
  { plotNumber: 39, name: 'עומר עתידיה', customerName: 'עינות קדם בע"מ - בתנאי שהם נותנים צ', dunam: 20, plotType: null, active: true },
  { plotNumber: 29, name: 'עשהאל', customerName: 'עשהאל קורניץ', dunam: 55, plotType: 'בקעה', active: true },
  { plotNumber: 54, name: 'פרדס חמרה', customerName: 'מקנה הרים', dunam: 223, plotType: 'בקעה', active: true },
  { plotNumber: 30, name: 'צוריאל', customerName: 'צוריאל לילנטל', dunam: 20, plotType: 'בקעה', active: true },
  { plotNumber: 89, name: 'ציר לבן', customerName: 'מקנה הרים', dunam: 80, plotType: 'הר', active: true },
  { plotNumber: 93, name: 'רועי אלמקייס', customerName: 'רועי אלמקייס', dunam: 88, plotType: 'בקעה', active: true },
  { plotNumber: 88, name: 'רועי ביטי', customerName: 'רועי ביטי', dunam: 110, plotType: 'הר', active: true },
  { plotNumber: 66, name: 'רימונים', customerName: 'נריה בן פזי', dunam: 1, plotType: 'הר', active: true },
  { plotNumber: 55, name: 'רן פורת', customerName: 'רן פורת', dunam: 85, plotType: 'בקעה', active: true },
  { plotNumber: 15, name: 'שילה ישראל', customerName: 'נוף עמי', dunam: 50, plotType: 'הר', active: true },
  { plotNumber: 48, name: 'שעלבים', customerName: 'שעלבים', dunam: 1000, plotType: null, active: true },
  { plotNumber: 84, name: 'שרביט-רפא', customerName: 'משה שרביט', dunam: 150, plotType: 'בקעה', active: true },
  { plotNumber: 37, name: 'תבלינים - מקס', customerName: 'החווה של אנטה - מקס', dunam: 50, plotType: null, active: true },
  { plotNumber: 77, name: 'תום זריעה שניה', customerName: 'תום חמרה (משק שוורץ)', dunam: 70, plotType: 'בקעה', active: true },
  { plotNumber: 65, name: 'תום סבכה', customerName: 'תום חמרה (משק שוורץ)', dunam: 700, plotType: 'בקעה', active: true },
  { plotNumber: 76, name: 'תום קצח קינואה', customerName: 'תום חמרה (משק שוורץ)', dunam: 100, plotType: 'בקעה', active: true },
  { plotNumber: 69, name: 'תומר פניני', customerName: 'תומר פניני', dunam: 70, plotType: 'בקעה', active: true },
]

function findCustomerIdByName(customerName: string): string {
  const resolved = resolvePlotCustomerName(customerName)
  const customer = customersSeedData.find((row) => row.name === resolved)
  if (!customer) {
    throw new Error(`Customer not found for plot seed: ${customerName} (resolved: ${resolved})`)
  }
  return String(customer._id)
}

export const plotsSeedData: CollectionDocument[] = plotsSeedRows.map((row) => {
  const customerId = findCustomerIdByName(row.customerName)
  const customer = customersSeedData.find((c) => c._id === customerId)
  return {
    _id: mockObjectId(`plot-${row.plotNumber}`),
    plotNumber: row.plotNumber,
    name: row.name,
    customer: customerId,
    customerName: String(customer?.name ?? ''),
    dunam: row.dunam,
    plotType: row.plotType,
    active: row.active,
  }
})
