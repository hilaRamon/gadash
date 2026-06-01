import { textColumn } from '../columnHelpers'
import type { CollectionSchema } from '../types'

const pricingFormOptions = [
  { value: 'דונם', label: 'דונם' },
  { value: 'שעתי', label: 'שעתי' },
  { value: 'כמות יחידות', label: 'כמות יחידות' },
]

const operationTypeOptions = [
  { value: 'עיבוד', label: 'עיבוד' },
  { value: 'מנהלה', label: 'מנהלה' },
]

export const operationsSchema: CollectionSchema = {
  id: 'operations',
  collection: 'operations',
  label: 'פעולות',
  columns: [
    textColumn('name', 'שם', { searchable: true }),
    {
      key: 'currentCost',
      label: 'מחיר',
      type: 'number',
      sortable: true,
      width: '5rem',
    },
    {
      key: 'pricingForm',
      label: 'צורת תמחור',
      type: 'enum',
      enumOptions: pricingFormOptions,
      filterable: true,
    },
    {
      key: 'operationType',
      label: 'סוג',
      type: 'enum',
      enumOptions: operationTypeOptions,
      filterable: true,
    },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  form: {
    createTitle: 'הוספת פעולה',
    editTitle: 'עריכת פעולה',
    fields: [
      { key: 'name', label: 'שם', type: 'text', required: true },
      {
        key: 'pricingForm',
        label: 'צורת תמחור',
        type: 'enum',
        required: true,
        enumOptions: pricingFormOptions,
      },
      {
        key: 'operationType',
        label: 'סוג',
        type: 'enum',
        required: true,
        enumOptions: operationTypeOptions,
      },
      { key: 'currentCost', label: 'מחיר', type: 'number', required: true },
    ],
  },
}
