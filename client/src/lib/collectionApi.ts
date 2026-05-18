import api from './api'
import type { CollectionDocument } from '../schema/types'
import type { TableQueryParams } from '../schema/tableQuery'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const mockStores = new Map<string, CollectionDocument[]>()

function seedMockData(collection: string): CollectionDocument[] {
  const labels: Record<string, string> = {
    employees: 'עובד',
    customers: 'לקוח',
    contractors: 'קבלן',
    operations: 'פעולה',
    materials: 'חומר',
    bales: 'חבילה',
    tractors: 'כלי',
    plots: 'חלקה',
    fuelTanks: 'מיכל',
    agriculturalSeasons: 'עונה',
  }
  const prefix = labels[collection] ?? 'פריט'

  return Array.from({ length: 5 }, (_, i) => ({
    id: `${collection}-${i + 1}`,
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

async function listMock(collection: string): Promise<CollectionDocument[]> {
  await delay(200)
  return [...getMockStore(collection)]
}

async function createMock(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150)
  const store = getMockStore(collection)
  const doc: CollectionDocument = {
    id: `${collection}-${Date.now()}`,
    ...body,
  }
  store.push(doc)
  return doc
}

async function updateMock(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150)
  const store = getMockStore(collection)
  const index = store.findIndex((d) => d.id === id)
  if (index === -1) throw new Error('לא נמצא')
  store[index] = { ...store[index], ...body, id }
  return store[index]
}

async function removeMock(collection: string, id: string): Promise<void> {
  await delay(150)
  const store = getMockStore(collection)
  const index = store.findIndex((d) => d.id === id)
  if (index !== -1) store.splice(index, 1)
}

async function removeManyMock(collection: string, ids: string[]): Promise<void> {
  await delay(200)
  const store = getMockStore(collection)
  for (const id of ids) {
    const index = store.findIndex((d) => d.id === id)
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
