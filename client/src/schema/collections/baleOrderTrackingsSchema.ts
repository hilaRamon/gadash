import type { CollectionSchema } from '../types'
import { formatNumber } from '../../lib/formatNumber'

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL')
}

export const baleOrderTrackingsSchema: CollectionSchema = {
  id: 'bale-order-trackings',
  collection: 'baleOrderTrackings',
  label: 'הזמנות חבילות',
  columns: [
    {
      key: 'date',
      label: 'תאריך',
      type: 'date',
      sortable: true,
      format: (value) => formatDate(value),
      width: '8rem',
    },
    {
      key: 'bale',
      label: 'סוג',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.baleName ?? row.bale,
    },
    {
      key: 'customer',
      label: 'לקוח',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.customerName ?? row.customer,
    },
    {
      key: 'quantity',
      label: 'כמות',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'pricePerTon',
      label: 'מחיר לטון',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '8rem',
    },
    {
      key: 'pricePerUnit',
      label: 'מחיר ליחידה',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '8rem',
    },
    {
      key: 'weight',
      label: 'משקל',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'weighed',
      label: 'נשקל',
      type: 'boolean',
      sortable: true,
      format: (value) => (value === true ? 'כן' : 'לא'),
      width: '6rem',
    },
    {
      key: 'transportPrice',
      label: 'מחיר הובלה',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '8rem',
    },
    {
      key: 'finalPrice',
      label: 'מחיר סופי',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '8rem',
    },
    {
      key: 'notes',
      label: 'הערות',
      type: 'text',
      searchable: true,
    },
  ],
  defaultSort: { field: 'date', direction: 'desc' },
  form: {
    createTitle: 'הוספת הזמנת חבילות',
    editTitle: 'עריכת הזמנת חבילות',
    fields: [
      { key: 'date', label: 'תאריך', type: 'date', required: true },
      {
        key: 'bale',
        label: 'סוג',
        type: 'reference',
        required: true,
        referenceCollection: 'bales',
      },
      { key: 'pricePerTon', label: 'מחיר לטון', type: 'number' },
      { key: 'pricePerUnit', label: 'מחיר ליחידה', type: 'number' },
      {
        key: 'customer',
        label: 'לקוח',
        type: 'reference',
        required: true,
        referenceCollection: 'customers',
      },
      { key: 'quantity', label: 'כמות', type: 'number', required: true },
      { key: 'weight', label: 'משקל', type: 'number' },
      { key: 'weighed', label: 'נשקל', type: 'boolean', defaultValue: false },
      { key: 'transportPrice', label: 'מחיר הובלה', type: 'number' },
      {
        key: 'wasCharged',
        label: 'חויב',
        type: 'boolean',
        hidden: true,
        defaultValue: false,
      },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
