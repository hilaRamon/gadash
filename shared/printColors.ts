/** Print/PDF bill palette — shared by client preview and server HTML templates. */
export const printColors = {
  bg: '#ffffff',
  text: '#1a202c',
  textSecondary: '#4a5568',
  border: '#e2e8f0',
  surface: '#f7fafc',
} as const

export function getBillStyles(): string {
  const c = printColors
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      color: ${c.text};
      background: ${c.bg};
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
      border-bottom: 2px solid ${c.border};
    }
    .bill-header h1 {
      margin: 0 0 0.35rem;
      font-size: 1.35rem;
      font-weight: 700;
    }
    .bill-meta {
      margin: 0;
      color: ${c.textSecondary};
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
      border: 1px solid ${c.border};
      text-align: right;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      background: ${c.surface};
      font-weight: 600;
      color: ${c.textSecondary};
    }
    .bill-section-operations th:nth-child(1),
    .bill-section-operations td:nth-child(1) { width: 12%; }
    .bill-section-operations th:nth-child(2),
    .bill-section-operations td:nth-child(2) { width: 24%; }
    .bill-section-operations th:nth-child(3),
    .bill-section-operations td:nth-child(3) { width: 18%; }
    .bill-section-operations th:nth-child(4),
    .bill-section-operations td:nth-child(4) { width: 16%; }
    .bill-section-operations th:nth-child(5),
    .bill-section-operations td:nth-child(5) { width: 12%; }
    .bill-section-operations th:nth-child(6),
    .bill-section-operations td:nth-child(6) { width: 18%; }
    .bill-section-operations-no-plot th:nth-child(1),
    .bill-section-operations-no-plot td:nth-child(1) { width: 14%; }
    .bill-section-operations-no-plot th:nth-child(2),
    .bill-section-operations-no-plot td:nth-child(2) { width: 36%; }
    .bill-section-operations-no-plot th:nth-child(3),
    .bill-section-operations-no-plot td:nth-child(3) { width: 18%; }
    .bill-section-operations-no-plot th:nth-child(4),
    .bill-section-operations-no-plot td:nth-child(4) { width: 14%; }
    .bill-section-operations-no-plot th:nth-child(5),
    .bill-section-operations-no-plot td:nth-child(5) { width: 18%; }
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
    .bill-section-bales th:nth-child(1),
    .bill-section-bales td:nth-child(1) { width: 12%; }
    .bill-section-bales th:nth-child(2),
    .bill-section-bales td:nth-child(2) { width: 24%; }
    .bill-section-bales th:nth-child(3),
    .bill-section-bales td:nth-child(3) { width: 12%; }
    .bill-section-bales th:nth-child(4),
    .bill-section-bales td:nth-child(4) { width: 16%; }
    .bill-section-bales th:nth-child(5),
    .bill-section-bales td:nth-child(5) { width: 12%; }
    .bill-section-bales th:nth-child(6),
    .bill-section-bales td:nth-child(6) { width: 24%; }
    td.price,
    td.numeric,
    .bill-total-amount {
      direction: ltr;
      text-align: right;
      white-space: nowrap;
      unicode-bidi: isolate;
    }
    .subtotal-row td {
      font-weight: 700;
      background: ${c.surface};
    }
    .bill-total {
      margin-top: 1.5rem;
      padding-top: 0.75rem;
      border-top: 2px solid ${c.border};
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .bill-total-amount {
      font-size: 1.15rem;
    }
`
}
