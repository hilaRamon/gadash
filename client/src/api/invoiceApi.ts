import api from "./api";

export type InvoiceMonthlySummary = {
  month: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
};

export async function fetchInvoiceMonthlySummary(
  month: string,
): Promise<InvoiceMonthlySummary> {
  const { data } = await api.get<InvoiceMonthlySummary>(
    "/api/invoices/monthly-summary",
    { params: { month } },
  );
  return data;
}

export async function uploadInvoiceFile(id: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await api.post(`/api/invoices/${id}/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function fetchInvoiceFileBlobUrl(id: string): Promise<{
  blobUrl: string;
  contentType: string;
}> {
  const { data } = await api.get(`/api/invoices/${id}/file`, {
    responseType: "blob",
  });
  return {
    blobUrl: URL.createObjectURL(data),
    contentType: data.type || "application/octet-stream",
  };
}
