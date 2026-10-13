import { formatNumber2 } from '@/lib/formatNumber'
import { formatTableDate } from '@/lib/dateFieldFormat'
import { getCurrentSeasonYear } from '@/lib/seasonRange'
import type { CollectionSchema } from '../types'

function seasonYearFromDate(value: unknown): string | number {
  if (value == null || value === '') return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''
  return getCurrentSeasonYear(date)
}

export const invoicesSchema: CollectionSchema = {
  id: 'invoices',
  collection: 'invoices',
  label: 'חשבוניות',
  columns: [
    {
      key: 'seasonYear',
      label: 'עונה',
      type: 'number',
      searchable: false,
      sortable: false,
      getValue: (row) => seasonYearFromDate(row.date),
      format: (value) => (value == null || value === '' ? '' : String(value)),
      width: '5rem',
    },
    {
      key: 'date',
      label: 'תאריך',
      type: 'date',
      sortable: true,
      format: (value) => formatTableDate(value),
      width: '8rem',
    },
    {
      key: 'invoiceNumber',
      label: 'מספר חשבונית',
      type: 'text',
      searchable: true,
    },
    {
      key: 'companyName',
      label: 'שם החברה',
      type: 'text',
      searchable: true,
    },
    {
      key: 'amount',
      label: 'סכום',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber2(value),
      width: '8rem',
    },
    {
      key: 'dueDate',
      label: 'תאריך לתשלום',
      type: 'date',
      sortable: true,
      format: (value) => formatTableDate(value),
      width: '8rem',
    },
    {
      key: 'paid',
      label: 'שולם',
      type: 'boolean',
      filterable: true,
      format: (value) => (value ? 'שולם' : 'לא שולם'),
      width: '6rem',
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
    createTitle: 'הוספת חשבונית',
    editTitle: 'עריכת חשבונית',
    fields: [
      { key: 'date', label: 'תאריך', type: 'date', required: true },
      { key: 'invoiceNumber', label: 'מספר חשבונית', type: 'text', required: true },
      { key: 'companyName', label: 'שם החברה', type: 'text', required: true },
      { key: 'amount', label: 'סכום', type: 'number', required: true },
      { key: 'dueDate', label: 'תאריך לתשלום', type: 'month' },
      {
        key: 'paid',
        label: 'שולם',
        type: 'boolean',
        defaultValue: false,
      },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
