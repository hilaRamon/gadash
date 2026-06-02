import { mockObjectId } from '../lib/mockObjectId'
import { customersSeedData } from './customersSeed'
import { resolvePlotCustomerName } from './plotCustomerAliases'
import type { CollectionDocument } from '../schema/types'

export type PlotSeedRow = {
  name: string
  customerName: string
  dunam: number
  plotType: 'הר' | 'בקעה' | null
  active: boolean
}

export const plotsSeedRows: PlotSeedRow[] = [
  { name: 'אביחי ינון', customerName: 'אביחי (אליה) ינון', dunam: 50, plotType: 'בקעה', active: true },
  { name: 'אביתר קארו', customerName: 'אביתר קארו', dunam: 1, plotType: 'הר', active: true },
  { name: 'אברהם דורי', customerName: 'אברהם דורי', dunam: 20, plotType: 'בקעה', active: true },
  { name: 'אור ציון משולמי', customerName: 'אור ציון משולמי', dunam: 50, plotType: 'הר', active: true },
  { name: 'אורי נועם', customerName: 'אורי נועם', dunam: 30, plotType: 'בקעה', active: true },
  { name: 'אורי-אום זוקא', customerName: 'אורי כהן', dunam: 130, plotType: 'בקעה', active: true },
  { name: 'איתמר חדש', customerName: 'איתמר כהן', dunam: 50, plotType: 'בקעה', active: false },
  { name: 'איתמר בהן- כל החלקות', customerName: 'איתמר כהן', dunam: 281, plotType: 'בקעה', active: true },
  { name: 'איתמר- כניסה', customerName: 'איתמר כהן', dunam: 29, plotType: 'הר', active: false },
  { name: 'איתמר- מטווח תחתון', customerName: 'איתמר כהן', dunam: 40.1, plotType: 'בקעה', active: false },
  { name: 'איתמר- נחשון', customerName: 'איתמר כהן', dunam: 19, plotType: 'בקעה', active: false },
  { name: 'איתמר- שדה ירוק', customerName: 'איתמר כהן', dunam: 29, plotType: 'בקעה', active: false },
  { name: 'איתמר-מטווח עליון', customerName: 'איתמר כהן', dunam: 18, plotType: 'בקעה', active: false },
  { name: 'אלישע טורנר', customerName: 'אלישע טורנר', dunam: 1, plotType: 'הר', active: true },
  { name: 'אלעד חוות אביה', customerName: 'אלעד חוות אביה', dunam: 45, plotType: 'בקעה', active: true },
  { name: 'אסף אזולאי עדי עד', customerName: 'אסף אזולאי', dunam: 110, plotType: 'הר', active: true },
  { name: 'אסף אזולאי-כוכב השחר', customerName: 'אסף אזולאי', dunam: 45, plotType: 'הר', active: true },
  { name: 'אריאל מעל אדומים', customerName: 'אריאל גרילניק', dunam: 20, plotType: 'הר', active: true },
  { name: 'גבעה ואדי', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 35.5, plotType: 'הר', active: false },
  { name: 'גבעה עליון', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 59.4, plotType: 'הר', active: false },
  { name: 'גבעה עליונה+ גבעת ואדי', customerName: 'דיר מקנה הרים - ללא חשבונית', dunam: 100, plotType: 'הר', active: true },
  { name: 'גבעות עולם', customerName: 'חוות גבעות עולם', dunam: 250, plotType: 'הר', active: true },
  { name: 'גבעות עולם בקיה', customerName: 'חוות גבעות עולם', dunam: 115, plotType: 'הר', active: true },
  { name: 'גבעות עולם שיבולת', customerName: 'חוות גבעות עולם', dunam: 45, plotType: 'הר', active: true },
  { name: 'גבעות עולם-אורגני', customerName: 'חוות גבעות עולם', dunam: 90, plotType: 'הר', active: true },
  { name: 'גדי', customerName: 'מקנה הרים', dunam: 66, plotType: 'בקעה', active: true },
  { name: 'גיתית', customerName: 'מקנה הרים', dunam: 600, plotType: 'בקעה', active: true },
  { name: 'גקסון גיתית', customerName: 'משק סנה (נועם ג\'קסון)', dunam: 160, plotType: 'בקעה', active: true },
  { name: 'דידי ליד משכיות', customerName: 'דוד הרצליך', dunam: 40, plotType: 'בקעה', active: true },
  { name: 'זור', customerName: 'מקנה הרים', dunam: 165, plotType: 'בקעה', active: true },
  { name: 'זור חמרה', customerName: 'מקנה הרים', dunam: 89, plotType: 'בקעה', active: true },
  { name: 'זור מכורה', customerName: 'מקנה הרים', dunam: 1, plotType: 'בקעה', active: true },
  { name: 'חוות מגדי', customerName: 'חוות מגדי (יוסף חיים מגדי)', dunam: 1, plotType: 'בקעה', active: true },
  { name: 'חלקה קוקו', customerName: 'מקנה הרים', dunam: 10, plotType: 'הר', active: true },
  { name: 'חמרה ואדי', customerName: 'מקנה הרים', dunam: 40, plotType: 'בקעה', active: true },
  { name: 'חמרה מזרח', customerName: 'מקנה הרים', dunam: 137.6, plotType: 'בקעה', active: true },
  { name: 'חמרה צפון צפון קרוב', customerName: 'מקנה הרים', dunam: 100.8, plotType: 'בקעה', active: true },
  { name: 'חמרה צפון צפון רחוק', customerName: 'מקנה הרים', dunam: 135.4, plotType: 'בקעה', active: true },
  { name: 'חן בן אליהו', customerName: 'חן בן אליהו', dunam: 20, plotType: 'הר', active: true },
  { name: 'טירת צבי', customerName: 'טירת צבי', dunam: 1, plotType: null, active: true },
  { name: 'יונתן בוצר', customerName: 'יונתן בוצר', dunam: 180, plotType: null, active: true },
  { name: 'ינון כהן', customerName: 'ינון כהן', dunam: 50, plotType: 'בקעה', active: true },
  { name: 'ישי בראון קבלנות', customerName: 'י.בראון עיבודים בע"מ', dunam: 1, plotType: null, active: true },
  { name: 'ישי לוי', customerName: 'ישי לוי', dunam: 80, plotType: 'בקעה', active: true },
  { name: 'כלל החלפות', customerName: 'מקנה הרים', dunam: 1, plotType: 'הר', active: true },
  { name: 'ליעוז - בכביש', customerName: 'ג\'יי.איי.רון בע"מ (ליעוז)', dunam: 262.3, plotType: null, active: true },
  { name: 'לירון גרוס', customerName: 'לירון גרוס', dunam: 130, plotType: 'בקעה', active: true },
  { name: 'לירון שמשוביץ חמרה', customerName: 'לירון שמשוביץ חמרה', dunam: 50, plotType: 'בקעה', active: true },
  { name: 'שביה', customerName: 'מקנה הרים', dunam: 80, plotType: 'הר', active: true },
  { name: 'מודיעין', customerName: 'מקנה הרים', dunam: 230, plotType: null, active: true },
  { name: 'מיכאל שלמה', customerName: 'מיכאל שלמה', dunam: 1, plotType: 'הר', active: true },
  { name: 'מיכה סודאי', customerName: 'מיכה סודאי', dunam: 1, plotType: null, active: true },
  { name: 'מכורה אנטנה', customerName: 'מקנה הרים', dunam: 252.2, plotType: 'בקעה', active: true },
  { name: 'מכורה גבוהה', customerName: 'מקנה הרים', dunam: 126.8, plotType: 'בקעה', active: true },
  { name: 'מכורה דקלים', customerName: 'מקנה הרים', dunam: 45, plotType: 'בקעה', active: true },
  { name: 'מכורה הר', customerName: 'מקנה הרים', dunam: 200, plotType: 'בקעה', active: true },
  { name: 'מכורה ישוב', customerName: 'מקנה הרים', dunam: 80, plotType: 'בקעה', active: true },
  { name: 'מכורה בכביש', customerName: 'מקנה הרים', dunam: 175, plotType: 'בקעה', active: true },
  { name: 'מכורה סטס', customerName: 'מקנה הרים', dunam: 184, plotType: null, active: true },
  { name: 'מכורה פרדס', customerName: 'מקנה הרים', dunam: 98.8, plotType: 'בקעה', active: true },
  { name: 'מכורה צפון', customerName: 'מקנה הרים', dunam: 350.8, plotType: 'בקעה', active: true },
  { name: 'מכורה רחוק', customerName: 'מקנה הרים', dunam: 86.5, plotType: 'בקעה', active: true },
  { name: 'מכורה תחתון', customerName: 'מקנה הרים', dunam: 136, plotType: 'בקעה', active: true },
  { name: 'מכירת סחורה', customerName: 'מכירת סחורה', dunam: 1111, plotType: 'בקעה', active: true },
  { name: 'מכירת סחורה', customerName: 'מכירת סחורה', dunam: 1, plotType: null, active: true },
  { name: 'מלאכי השלום', customerName: 'ליבי בניה ותשתיות בע"מ', dunam: 737, plotType: 'בקעה', active: true },
  { name: 'מנחם', customerName: 'מנחם גושן', dunam: 40, plotType: 'בקעה', active: true },
  { name: 'משה שרביט', customerName: 'משה שרביט', dunam: 60, plotType: 'בקעה', active: true },
  { name: 'משק אחיה', customerName: 'משק אחיה', dunam: 147, plotType: 'הר', active: true },
  { name: 'משק סנה', customerName: 'משק סנה (נועם ג\'קסון)', dunam: 1, plotType: null, active: false },
  { name: 'משק שדה (מרדכי שדה)', customerName: 'משק שדה (מרדכי שדה)', dunam: 1, plotType: 'הר', active: true },
  { name: 'נגרייה', customerName: 'גבע ברקן תעשיות מתקדמות בע"מ', dunam: 1, plotType: null, active: true },
  { name: 'ניסים עידן', customerName: 'ניסים עידן', dunam: 33, plotType: 'הר', active: true },
  { name: 'נריה בן פזי', customerName: 'נריה בן פזי', dunam: 180, plotType: null, active: true },
  { name: 'נתי 35', customerName: 'נתי שולב', dunam: 35, plotType: 'הר', active: true },
  { name: 'נתי- עמק ממגד', customerName: 'נתי שולב', dunam: 124, plotType: 'הר', active: true },
  { name: 'עומר עתידיה', customerName: 'עינות קדם בע"מ - בתנאי שהם נותנים צ', dunam: 20, plotType: null, active: true },
  { name: 'עשהאל', customerName: 'עשהאל קורניץ', dunam: 55, plotType: 'בקעה', active: true },
  { name: 'פרדס חמרה', customerName: 'מקנה הרים', dunam: 223, plotType: 'בקעה', active: true },
  { name: 'צוריאל', customerName: 'צוריאל לילנטל', dunam: 20, plotType: 'בקעה', active: true },
  { name: 'ציר לבן', customerName: 'מקנה הרים', dunam: 80, plotType: 'הר', active: true },
  { name: 'רועי אלמקייס', customerName: 'רועי אלמקייס', dunam: 88, plotType: 'בקעה', active: true },
  { name: 'רועי ביטי', customerName: 'רועי ביטי', dunam: 110, plotType: 'הר', active: true },
  { name: 'רימונים', customerName: 'נריה בן פזי', dunam: 1, plotType: 'הר', active: true },
  { name: 'רן פורת', customerName: 'רן פורת', dunam: 85, plotType: 'בקעה', active: true },
  { name: 'שילה ישראל', customerName: 'נוף עמי', dunam: 50, plotType: 'הר', active: true },
  { name: 'שעלבים', customerName: 'שעלבים', dunam: 1000, plotType: null, active: true },
  { name: 'שרביט-רפא', customerName: 'משה שרביט', dunam: 150, plotType: 'בקעה', active: true },
  { name: 'תבלינים - מקס', customerName: 'החווה של אנטה - מקס', dunam: 50, plotType: null, active: true },
  { name: 'תום זריעה שניה', customerName: 'תום חמרה (משק שוורץ)', dunam: 70, plotType: 'בקעה', active: true },
  { name: 'תום סבכה', customerName: 'תום חמרה (משק שוורץ)', dunam: 700, plotType: 'בקעה', active: true },
  { name: 'תום קצח קינואה', customerName: 'תום חמרה (משק שוורץ)', dunam: 100, plotType: 'בקעה', active: true },
  { name: 'תומר פניני', customerName: 'תומר פניני', dunam: 70, plotType: 'בקעה', active: true },
]

function findCustomerIdByName(customerName: string): string {
  const resolved = resolvePlotCustomerName(customerName)
  const customer = customersSeedData.find((row) => row.name === resolved)
  if (!customer) {
    throw new Error(`Customer not found for plot seed: ${customerName} (resolved: ${resolved})`)
  }
  return String(customer._id)
}

export const plotsSeedData: CollectionDocument[] = plotsSeedRows.map((row, index) => {
  const customerId = findCustomerIdByName(row.customerName)
  const customer = customersSeedData.find((c) => c._id === customerId)
  return {
    _id: mockObjectId(`plot-${index}`),
    name: row.name,
    customer: customerId,
    customerName: String(customer?.name ?? ''),
    dunam: row.dunam,
    plotType: row.plotType,
    active: row.active,
  }
})
