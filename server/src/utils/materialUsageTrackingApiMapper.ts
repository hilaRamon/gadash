import type { ApiDocument } from '../types/apiDocument';
import { calcCustomerCost } from './materialPricing';
import { toApiDocument } from './toApiDocument';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
};

type PopulatedPlotRef = PopulatedRef & {
  customer?: unknown;
};

type PopulatedMaterialRef = PopulatedRef & {
  currentBuyingCost?: unknown;
  currentSalePercent?: unknown;
};

function toRefParts(value: unknown): { id: string; name: string } {
  const ref = value as PopulatedRef | undefined;
  if (ref && typeof ref === 'object' && ref._id != null) {
    return {
      id: String(ref._id),
      name: String(ref.name ?? ''),
    };
  }
  return {
    id: value == null ? '' : String(value),
    name: '',
  };
}

function toAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function calcDisplayFinalPrice(doc: Record<string, unknown>): number {
  const material = doc.material as PopulatedMaterialRef | undefined;
  const amount = toAmount(doc.amount);
  if (!material || typeof material !== 'object') return 0;

  const cost = Number(material.currentBuyingCost ?? 0);
  const percent = Number(material.currentSalePercent ?? 15);
  let unitPrice = 0;
  if (Number.isFinite(cost) && Number.isFinite(percent)) {
    unitPrice = calcCustomerCost(cost, percent);
  }

  return Number((unitPrice * amount).toFixed(3));
}

export function materialUsageTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const material = toRefParts(doc.material);
  const plot = toRefParts(doc.plot);
  const plotRaw = doc.plot as PopulatedPlotRef | undefined;
  const customerFromPlot =
    plotRaw && typeof plotRaw === 'object' ? toRefParts(plotRaw.customer) : { id: '', name: '' };
  const legacyCustomer = toRefParts(doc.customer);
  const customer = customerFromPlot.id ? customerFromPlot : legacyCustomer;
  const employee = toRefParts(doc.employee);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    material: material.id,
    materialName: material.name,
    customer: customer.id,
    customerName: customer.name,
    plot: plot.id,
    plotName: plot.name,
    employee: employee.id,
    employeeName: employee.name,
    finalPrice: calcDisplayFinalPrice(doc),
  };
}

export function materialUsageTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(materialUsageTrackingToApiDocument);
}
