import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

type EmployeeSeed = {
  name: string
  email?: string
  mobile?: string
  notes?: string
}

const employees: EmployeeSeed[] = [
  { name: 'אורן בן יצחק (בן פורת)' },
  { name: 'יובל' },
  { name: 'שלמה' },
  { name: 'גואל' },
  { name: 'בת ציון סקלי' },
  { name: 'שרוליק', mobile: '0585454869' },
  { name: 'שמר', mobile: '0556654103' },
  { name: 'דוד לוי', mobile: '0586528659' },
  { name: 'דביר שריקי' },
  { name: 'יעקובס' },
  { name: 'גלעד צורי', mobile: '052-7204855' },
  { name: 'ישי שדה', mobile: '0586693708' },
  { name: 'יוסף ביטי', mobile: '053-2383363' },
  { name: 'דוד רסט', mobile: '0542143043' },
  { name: 'הילה' },
  { name: 'יוליוס', mobile: '0546522906' },
  { name: 'אורי נעם', mobile: '0507405556' },
  { name: 'אבי סיטון' },
  { name: 'יצחק סקלי', mobile: '0526071701' },
  { name: 'עובד חיצוני' },
  { name: 'פנחס' },
  { name: 'קדם' },
  { name: 'יצחק שמרלובסקי' },
  { name: 'רונן סקלי' },
  { name: 'אלישיב סקלי' },
]

export const employeesSeedData: CollectionDocument[] = employees.map((row, index) => ({
  _id: mockObjectId(`employee-${index + 1}`),
  name: row.name,
  email: row.email ?? '',
  mobile: row.mobile ?? '',
  notes: row.notes ?? '',
}))
