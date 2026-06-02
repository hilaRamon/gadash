import api from './api'
import { contractorsSeedData } from '../data/contractorsSeed'
import { customersSeedData } from '../data/customersSeed'
import { employeesSeedData } from '../data/employeesSeed'
import { plotsSeedData } from '../data/plotsSeed'
import { agriculturalSeasonsSeedData } from '../data/agriculturalSeasonsSeed'
import { fuelTanksSeedData } from '../data/fuelTanksSeed'
import { materialsSeedData } from '../data/materialsSeed'
import { balesSeedData } from '../data/balesSeed'
import { operationsSeedData } from '../data/operationsSeed'
import { tractorsSeedData } from '../data/tractorsSeed'
import { suppliersSeedData } from '../data/suppliersSeed'
import { materialPurchaseTrackingsSeedData } from '../data/materialPurchaseTrackingsSeed'
import { materialUsageTrackingsSeedData } from '../data/materialUsageTrackingsSeed'
import type { CollectionDocument } from '../schema/types'
import type { TableQueryParams } from '../schema/tableQuery'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const mockStores = new Map<string, CollectionDocument[]>()

function seedMockData(collection: string): CollectionDocument[] {
  if (collection === 'employees') {
    return employeesSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'customers') {
    return customersSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'contractors') {
    return contractorsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'suppliers') {
    return suppliersSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'tractors') {
    return tractorsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'operations') {
    return operationsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'materials') {
    return materialsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'bales') {
    return balesSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'plots') {
    return plotsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'agriculturalSeasons') {
    return agriculturalSeasonsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'fuelTanks') {
    return fuelTanksSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'materialPurchaseTrackings') {
    return materialPurchaseTrackingsSeedData.map((row) => ({ ...row }))
  }
  if (collection === 'materialUsageTrackings') {
    return materialUsageTrackingsSeedData.map((row) => ({ ...row }))
  }

  const labels: Record<string, string> = {
    employees: 'עובד',
    customers: 'לקוח',
    contractors: 'קבלן',
    suppliers: 'ספק',
    operations: 'פעולה',
    materials: 'חומר',
    bales: 'חבילה',
    tractors: 'כלי',
    plots: 'חלקה',
    fuelTanks: 'מיכל',
    agriculturalSeasons: 'עונה',
    materialPurchaseTrackings: 'רכש חומר',
    materialUsageTrackings: 'שימוש חומר',
  }
  const prefix = labels[collection] ?? 'פריט'

  return Array.from({ length: 5 }, (_, i) => ({
    _id: `${collection.padEnd(12, '0').slice(0, 12)}${String(i + 1).padStart(12, '0')}`,
    name: `${prefix} ${i + 1}`,
    notes: i % 2 === 0 ? 'הערה לדוגמה' : '',
  }))
}

function getMockStore(collection: string): CollectionDocument[] {
  if (!mockStores.has(collection)) {
    mockStores.set(collection, seedMockData(collection))
  }
  return mockStores.get(collection)!
}

function calcMaterialUsageFinalPrice(row: Record<string, unknown>): number {
  const materialId = String(row.material ?? '')
  const material = materialsSeedData.find((m) => String(m._id) === materialId)
  const unitPrice = Number(material?.customerCost ?? 0)
  const amount = Number(row.amount ?? 0)
  if (!Number.isFinite(unitPrice) || !Number.isFinite(amount)) return 0
  return Number((unitPrice * amount).toFixed(2))
}

function enrichMaterialUsageRow(row: CollectionDocument): CollectionDocument {
  const finalPrice = calcMaterialUsageFinalPrice(row)
  return { ...row, finalPrice }
}

async function listMock(collection: string): Promise<CollectionDocument[]> {
  await delay(200)
  const rows = [...getMockStore(collection)]
  if (collection === 'materialUsageTrackings') {
    return rows.map(enrichMaterialUsageRow)
  }
  return rows
}

async function createMock(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150)
  const store = getMockStore(collection)
  const doc: CollectionDocument = {
    _id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
    ...body,
  } as CollectionDocument
  if (collection === 'materialUsageTrackings') {
    const plot = plotsSeedData.find((p) => String(p._id) === String(doc.plot ?? ''))
    doc.customer = plot?.customer ?? ''
    doc.customerName = String(plot?.customerName ?? '')
  }
  store.push(doc)
  if (collection === 'materialUsageTrackings') {
    return enrichMaterialUsageRow(doc)
  }
  return doc
}

async function updateMock(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150)
  const store = getMockStore(collection)
  const index = store.findIndex((d) => d._id === id)
  if (index === -1) throw new Error('לא נמצא')
  store[index] = { ...store[index], ...body, _id: id }
  if (collection === 'materialUsageTrackings') {
    const plot = plotsSeedData.find((p) => String(p._id) === String(store[index].plot ?? ''))
    store[index].customer = plot?.customer ?? ''
    store[index].customerName = String(plot?.customerName ?? '')
    return enrichMaterialUsageRow(store[index])
  }
  return store[index]
}

async function removeMock(collection: string, id: string): Promise<void> {
  await delay(150)
  const store = getMockStore(collection)
  const index = store.findIndex((d) => d._id === id)
  if (index !== -1) store.splice(index, 1)
}

async function removeManyMock(collection: string, ids: string[]): Promise<void> {
  await delay(200)
  const store = getMockStore(collection)
  for (const id of ids) {
    const index = store.findIndex((d) => d._id === id)
    if (index !== -1) store.splice(index, 1)
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listCollection(
  collection: string,
  _params?: TableQueryParams,
): Promise<CollectionDocument[]> {
  if (useMock) return listMock(collection)
  const { data } = await api.get<CollectionDocument[]>(`/api/${collection}`)
  return data
}

export async function createDocument(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  if (useMock) return createMock(collection, body)
  const { data } = await api.post<CollectionDocument>(`/api/${collection}`, body)
  return data
}

export async function updateDocument(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  if (useMock) return updateMock(collection, id, body)
  const { data } = await api.put<CollectionDocument>(
    `/api/${collection}/${id}`,
    body,
  )
  return data
}

export async function deleteDocument(
  collection: string,
  id: string,
): Promise<void> {
  if (useMock) return removeMock(collection, id)
  await api.delete(`/api/${collection}/${id}`)
}

export async function deleteManyDocuments(
  collection: string,
  ids: string[],
): Promise<void> {
  if (useMock) return removeManyMock(collection, ids)
  await api.post(`/api/${collection}/bulk-delete`, { ids })
}
