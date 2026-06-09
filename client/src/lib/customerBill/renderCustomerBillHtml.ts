import type { CustomerBillDocument, CustomerBillSection } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderOperationsRow(line: CustomerBillSection["lines"][number]): string {
  return `
    <tr>
      <td>${escapeHtml(line.date)}</td>
      <td>${escapeHtml(line.description)}</td>
      <td>${escapeHtml(line.plotName ?? "")}</td>
      <td class="price">${escapeHtml(line.priceFormatted)}</td>
    </tr>`;
}

function renderQuantityWithUnitPriceRow(
  line: CustomerBillSection["lines"][number],
): string {
  return `
    <tr>
      <td>${escapeHtml(line.date)}</td>
      <td>${escapeHtml(line.description)}</td>
      <td>${escapeHtml(line.amount ?? "")}</td>
      <td class="price">${escapeHtml(line.unitPrice ?? "")}</td>
      <td class="price">${escapeHtml(line.priceFormatted)}</td>
    </tr>`;
}

function renderSection(section: CustomerBillSection): string {
  const isOperations = section.layout === "operations";
  const rows = section.lines
    .map((line) =>
      isOperations ? renderOperationsRow(line) : renderQuantityWithUnitPriceRow(line),
    )
    .join("");
  const colspan = isOperations ? 3 : 4;

  const header = isOperations
    ? `
          <tr>
            <th>תאריך</th>
            <th>תיאור</th>
            <th>חלקה</th>
            <th>מחיר</th>
          </tr>`
    : `
          <tr>
            <th>תאריך</th>
            <th>תיאור</th>
            <th>כמות</th>
            <th>מחיר ליחידה</th>
            <th>מחיר</th>
          </tr>`;

  return `
    <section class="bill-section ${isOperations ? "bill-section-operations" : "bill-section-quantity"}">
      <h2>${escapeHtml(section.title)}</h2>
      <table>
        <thead>${header}
        </thead>
        <tbody>
          ${rows}
          <tr class="subtotal-row">
            <td colspan="${colspan}">סה״כ ${escapeHtml(section.title)}</td>
            <td class="price">${escapeHtml(section.subtotalFormatted)}</td>
          </tr>
        </tbody>
      </table>
    </section>`;
}

const billStyles = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      color: #1a202c;
      background: #fff;
    }
    .bill {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 1.5rem 1.75rem;
    }
    .bill-header {
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
    }
    .bill-header h1 {
      margin: 0 0 0.35rem;
      font-size: 1.35rem;
      font-weight: 700;
    }
    .bill-meta {
      margin: 0;
      color: #4a5568;
      font-size: 0.95rem;
    }
    .bill-section {
      margin-bottom: 1.25rem;
    }
    .bill-section h2 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      padding: 0.4rem 0.45rem;
      border: 1px solid #e2e8f0;
      text-align: right;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      background: #f7fafc;
      font-weight: 600;
      color: #4a5568;
    }
    .bill-section-operations th:nth-child(1),
    .bill-section-operations td:nth-child(1) { width: 16%; }
    .bill-section-operations th:nth-child(2),
    .bill-section-operations td:nth-child(2) { width: 38%; }
    .bill-section-operations th:nth-child(3),
    .bill-section-operations td:nth-child(3) { width: 24%; }
    .bill-section-operations th:nth-child(4),
    .bill-section-operations td:nth-child(4) { width: 22%; }
    .bill-section-quantity th:nth-child(1),
    .bill-section-quantity td:nth-child(1) { width: 14%; }
    .bill-section-quantity th:nth-child(2),
    .bill-section-quantity td:nth-child(2) { width: 30%; }
    .bill-section-quantity th:nth-child(3),
    .bill-section-quantity td:nth-child(3) { width: 14%; }
    .bill-section-quantity th:nth-child(4),
    .bill-section-quantity td:nth-child(4) { width: 20%; }
    .bill-section-quantity th:nth-child(5),
    .bill-section-quantity td:nth-child(5) { width: 22%; }
    td.price {
      white-space: nowrap;
    }
    .subtotal-row td {
      font-weight: 700;
      background: #f7fafc;
    }
    .bill-total {
      margin-top: 1.5rem;
      padding-top: 0.75rem;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .bill-total-amount {
      font-size: 1.15rem;
    }
`;

function renderCustomerBillContent(bill: CustomerBillDocument): string {
  const sections = bill.sections.map(renderSection).join("");

  return `<div class="bill">
    <header class="bill-header">
      <h1>${escapeHtml(bill.customerName)}</h1>
      <p class="bill-meta">תאריך: ${escapeHtml(bill.billDate)}</p>
    </header>
    ${sections}
    <footer class="bill-total">
      <span>סה״כ לתשלום</span>
      <span class="bill-total-amount">${escapeHtml(bill.totalFormatted)}</span>
    </footer>
  </div>`;
}

export function renderCustomerBillPreviewHtml(bill: CustomerBillDocument): string {
  return `<style>${billStyles}</style>${renderCustomerBillContent(bill)}`;
}
