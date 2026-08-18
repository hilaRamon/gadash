import { formatNumber2 } from '@/lib/formatNumber'
import { getCurrentSeasonYear } from '@/lib/seasonRange'
import type { CollectionSchema } from '../types'

function formatDate(value: unknown): string {
  if (value == null || value === '') return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL')
}

function formatDueDate(value: unknown): string {
  if (value == null || value === '') return ''
  const iso = String(value).slice(0, 10)
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return formatDate(value)
  return `${Number(match[3])}.${Number(match[2])}.${match[1]}`
}

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
      format: (value) => formatDate(value),
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
      format: (value) => formatDueDate(value),
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
