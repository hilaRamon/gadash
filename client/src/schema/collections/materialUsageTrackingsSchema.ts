import type { CollectionSchema } from '../types'

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL')
}

function formatCurrency(value: unknown): string {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return ''
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const materialUsageTrackingsSchema: CollectionSchema = {
  id: 'material-usage-trackings',
  collection: 'materialUsageTrackings',
  label: 'שימוש בחומרים',
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
      key: 'material',
      label: 'חומר',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.materialName ?? row.material,
    },
    {
      key: 'customer',
      label: 'לקוח',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.customerName ?? row.customer,
    },
    {
      key: 'plot',
      label: 'חלקה',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.plotName ?? row.plot,
    },
    {
      key: 'employee',
      label: 'עובד',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.employeeName ?? row.employee,
    },
    {
      key: 'amount',
      label: 'כמות',
      type: 'number',
      sortable: true,
      width: '6rem',
    },
    {
      key: 'finalPrice',
      label: 'מחיר סופי',
      type: 'number',
      sortable: true,
      format: (value) => formatCurrency(value),
      width: '8rem',
    },
    {
      key: 'billable',
      label: 'לחיוב',
      type: 'boolean',
      sortable: true,
      format: (value) => (value === false ? 'לא' : 'כן'),
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
    createTitle: 'הוספת שימוש בחומר',
    editTitle: 'עריכת שימוש בחומר',
    fields: [
      { key: 'date', label: 'תאריך', type: 'date', required: true },
      {
        key: 'material',
        label: 'חומר',
        type: 'reference',
        required: true,
        referenceCollection: 'materials',
      },
      {
        key: 'plot',
        label: 'חלקה',
        type: 'reference',
        required: true,
        referenceCollection: 'plots',
      },
      {
        key: 'employee',
        label: 'עובד',
        type: 'reference',
        required: true,
        referenceCollection: 'employees',
      },
      { key: 'amount', label: 'כמות', type: 'number', required: true },
      { key: 'billable', label: 'לחיוב', type: 'boolean' },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
