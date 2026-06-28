import type { CustomerBillDocument, CustomerBillSection } from '../types/customerBill';
import { getBillStyles } from '../../../shared/printColors';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOperationsRow(
  line: CustomerBillSection['lines'][number],
  showPlots: boolean,
): string {
  const plotCell = showPlots ? `
      <td>${escapeHtml(line.plotName ?? '')}</td>` : '';
  return `
    <tr>
      <td>${escapeHtml(line.date)}</td>
      <td>${escapeHtml(line.description)}</td>${plotCell}
      <td class="price">${escapeHtml(line.unitPrice ?? '')}</td>
      <td class="numeric">${escapeHtml(line.amount ?? '')}</td>
      <td class="price">${escapeHtml(line.priceFormatted)}</td>
    </tr>`;
}

function renderQuantityWithUnitPriceRow(
  line: CustomerBillSection['lines'][number],
  showTransport: boolean,
): string {
  const transportCell = showTransport
    ? `
      <td class="price">${escapeHtml(line.transportPrice ?? '')}</td>`
    : '';
  return `
    <tr>
      <td>${escapeHtml(line.date)}</td>
      <td>${escapeHtml(line.description)}</td>
      <td class="numeric">${escapeHtml(line.amount ?? '')}</td>
      <td class="price">${escapeHtml(line.unitPrice ?? '')}</td>${transportCell}
      <td class="price">${escapeHtml(line.priceFormatted)}</td>
    </tr>`;
}

function isBaleSection(section: CustomerBillSection): boolean {
  return section.title === 'הזמנת חבילות';
}

function renderSection(section: CustomerBillSection, showPlots: boolean): string {
  const isOperations = section.layout === 'operations';
  const showTransport = isBaleSection(section);
  const rows = section.lines
    .map((line) =>
      isOperations
        ? renderOperationsRow(line, showPlots)
        : renderQuantityWithUnitPriceRow(line, showTransport),
    )
    .join('');
  const colspan = isOperations ? (showPlots ? 5 : 4) : showTransport ? 5 : 4;

  const plotHeader = showPlots
    ? `
            <th>חלקה</th>`
    : '';
  const transportHeader = showTransport
    ? `
            <th>הובלה</th>`
    : '';
  const header = isOperations
    ? `
          <tr>
            <th>תאריך</th>
            <th>תיאור</th>${plotHeader}
            <th>מחיר לדונם/יחידה</th>
            <th>כמות</th>
            <th>מחיר</th>
          </tr>`
    : showTransport
      ? `
          <tr>
            <th>תאריך</th>
            <th>תיאור</th>
            <th>כמות/משקל</th>
            <th>מחיר ליחידה/טון</th>${transportHeader}
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

  const operationsClass = showPlots
    ? 'bill-section-operations'
    : 'bill-section-operations-no-plot';
  const quantityClass = showTransport
    ? 'bill-section-bales'
    : 'bill-section-quantity';

  return `
    <section class="bill-section ${isOperations ? operationsClass : quantityClass}">
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

const billStyles = getBillStyles();

export function renderCustomerBillContent(bill: CustomerBillDocument): string {
  const sections = bill.sections
    .map((section) => renderSection(section, bill.showPlots))
    .join('');

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

export function renderCustomerBillHtml(bill: CustomerBillDocument): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>${billStyles}</style>
</head>
<body>
  ${renderCustomerBillContent(bill)}
</body>
</html>`;
}

export function renderCustomerBillPreviewHtml(bill: CustomerBillDocument): string {
  return `<style>${billStyles}</style>${renderCustomerBillContent(bill)}`;
}
