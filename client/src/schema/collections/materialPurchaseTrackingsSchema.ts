import type { CollectionSchema } from '../types'
import { formatNumber } from '../../lib/formatNumber'

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('he-IL')
}

export const materialPurchaseTrackingsSchema: CollectionSchema = {
  id: 'material-purchase-trackings',
  collection: 'materialPurchaseTrackings',
  label: 'רכש חומרים',
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
      key: 'supplier',
      label: 'ספק',
      type: 'reference',
      searchable: true,
      getValue: (row) => row.supplierName ?? row.supplier,
    },
    {
      key: 'unitPrice',
      label: 'מחיר לקג/ליטר',
      type: 'number',
      sortable: true,
      format: (value) => formatNumber(value),
      width: '8rem',
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
      getValue: (row) => Number(row.finalPrice ?? 0),
      format: (value, row) => {
        const fallback = Number(row.unitPrice ?? 0) * Number(row.amount ?? 0)
        const resolved = Number(value ?? fallback)
        return formatNumber(resolved)
      },
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
    createTitle: 'הוספת רכש חומר',
    editTitle: 'עריכת רכש חומר',
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
        key: 'supplier',
        label: 'ספק',
        type: 'reference',
        required: true,
        referenceCollection: 'suppliers',
      },
      { key: 'unitPrice', label: 'מחיר לקג/ליטר', type: 'number', required: true },
      { key: 'amount', label: 'כמות', type: 'number', required: true },
      { key: 'notes', label: 'הערות', type: 'textarea' },
    ],
  },
}
