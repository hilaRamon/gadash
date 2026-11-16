import api from "./api";
import type { CollectionDocument } from "@/schema/types";
import type {
  ListCollectionParams,
  PaginatedResult,
} from "./listCollectionParams";
import {
  buildListQueryString,
  isPaginatedResult,
} from "./listCollectionParams";

export async function listCollection(
  collection: string,
  params: ListCollectionParams & { page: number; pageSize?: number },
): Promise<PaginatedResult<CollectionDocument>>;
export async function listCollection(
  collection: string,
  params?: ListCollectionParams,
): Promise<CollectionDocument[]>;
export async function listCollection(
  collection: string,
  params?: ListCollectionParams,
): Promise<CollectionDocument[] | PaginatedResult<CollectionDocument>> {
  const query = buildListQueryString(params);
  const { data } = await api.get<
    CollectionDocument[] | PaginatedResult<CollectionDocument>
  >(`/api/${collection}${query}`);

  if (params?.page != null && !isPaginatedResult(data) && Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: params.page,
      pageSize: params.pageSize ?? data.length,
    };
  }

  return data;
}

export async function listCollectionAllForExport(
  collection: string,
  params: Omit<ListCollectionParams, "page" | "pageSize" | "export">,
): Promise<CollectionDocument[]> {
  const result = await listCollection(collection, {
    ...params,
    page: 1,
    pageSize: 10_000,
    export: true,
  });
  if (isPaginatedResult(result)) return result.items;
  return result;
}

export async function createDocument(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  const { data } = await api.post<CollectionDocument>(
    `/api/${collection}`,
    body,
  );
  return data;
}

export async function updateDocument(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  const { data } = await api.put<CollectionDocument>(
    `/api/${collection}/${id}`,
    body,
  );
  return data;
}

export async function deleteDocument(
  collection: string,
  id: string,
): Promise<void> {
  if (collection === "transportGlobalCharges") {
    const { cancelTransportGlobalCharge } = await import(
      "./transportGlobalChargeApi"
    );
    return cancelTransportGlobalCharge(id);
  }
  await api.delete(`/api/${collection}/${id}`);
}

export async function deleteManyDocuments(
  collection: string,
  ids: string[],
): Promise<void> {
  await api.post(`/api/${collection}/bulk-delete`, { ids });
}
