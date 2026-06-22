export function buildCustomerBillDownloadFilename(customerName: string): string {
  const name = String(customerName ?? "").trim() || "לקוח";
  const date = new Date().toLocaleDateString("he-IL");
  return `${name} חיוב ${date}.pdf`;
}
