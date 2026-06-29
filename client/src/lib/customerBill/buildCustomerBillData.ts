import type { CollectionDocument } from "../../schema/types";
import type {
  CustomerBillDocument,
  CustomerBillLine,
  CustomerBillSection,
  CustomerBillSectionLayout,
} from "./types";
import { formatNumber } from "../formatNumber";
import { isByWeightPricing } from "../baleOrderPricing";
import { resolveContractorCustomerUnitPrice } from "../contractorTrackingPricing";
import {
  isUnbilledBaleOrderForCustomer,
  isUnbilledContractorForCustomer,
  isUnbilledMaterialUsageForCustomer,
  isUnbilledOperationForCustomer,
} from "../unbilledTrackingFilters";

function formatBillDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

function todayBillDate(): string {
  return new Date().toLocaleDateString("he-IL");
}

function buildDescription(primary: string, secondary?: string | null): string {
  const a = String(primary ?? "").trim();
  const b = String(secondary ?? "").trim();
  if (a && b) return `${a} — ${b}`;
  return a || b;
}

function calcUnitPrice(finalPrice: number, amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "";
  return formatNumber(finalPrice / amount);
}

function compareByDate(a: CustomerBillLine, b: CustomerBillLine): number {
  const dateA = new Date(a.date.split(".").reverse().join("-")).getTime();
  const dateB = new Date(b.date.split(".").reverse().join("-")).getTime();
  if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
    return a.date.localeCompare(b.date, "he");
  }
  return dateA - dateB;
}

function operationLine(row: CollectionDocument): CustomerBillLine {
  const amountValue = Number(row.amount ?? 0);
  const unitCost = Number(row.unitCost ?? 0);
  return {
    date: formatBillDate(row.date),
    description: String(row.operationName ?? ""),
    plotName: String(row.plotName ?? ""),
    pricingForm: String(row.pricingForm ?? ""),
    amount:
      Number.isFinite(amountValue) && amountValue !== 0
        ? formatNumber(amountValue)
        : "",
    unitPrice:
      Number.isFinite(unitCost) && unitCost > 0 ? formatNumber(unitCost) : "",
    price: Number(row.finalPrice ?? 0),
    priceFormatted: formatNumber(row.finalPrice ?? 0),
  };
}

function contractorLine(row: CollectionDocument): CustomerBillLine {
  const amountValue = Number(row.unitAmount ?? 0);
  const unitPriceValue = resolveContractorCustomerUnitPrice({
    unitPrice: row.unitPrice,
    unitCustomerPrice: row.unitCustomerPrice,
  });
  const price = Number(row.customerFinalPrice ?? row.finalPrice ?? 0);
  return {
    date: formatBillDate(row.date),
    description: String(row.operationName ?? ""),
    plotName: String(row.plotName ?? ""),
    pricingForm: String(row.pricingForm ?? ""),
    amount:
      Number.isFinite(amountValue) && amountValue !== 0
        ? formatNumber(amountValue)
        : "",
    unitPrice:
      Number.isFinite(unitPriceValue) && unitPriceValue > 0
        ? formatNumber(unitPriceValue)
        : "",
    price,
    priceFormatted: formatNumber(price),
  };
}

function materialLine(
  row: CollectionDocument,
  showPlots: boolean,
): CustomerBillLine {
  const amountValue = Number(row.amount ?? 0);
  const finalPrice = Number(row.finalPrice ?? 0);
  const amount =
    Number.isFinite(amountValue) && amountValue !== 0
      ? formatNumber(amountValue)
      : "";
  return {
    date: formatBillDate(row.date),
    description: buildDescription(
      String(row.materialName ?? ""),
      showPlots ? String(row.plotName ?? "") : "",
    ),
    amount,
    unitPrice: calcUnitPrice(finalPrice, amountValue),
    price: finalPrice,
    priceFormatted: formatNumber(finalPrice),
  };
}

function baleLine(row: CollectionDocument): CustomerBillLine {
  const quantity = Number(row.quantity ?? 0);
  const weight = Number(row.weight ?? 0);
  const pricePerTon = Number(row.pricePerTon ?? 0);
  const pricePerUnit = Number(row.pricePerUnit ?? 0);
  const transport = Number(row.transportPrice ?? 0);
  const byWeight = isByWeightPricing(row.pricingForm);

  let amount = "";
  let unitPrice = "";

  if (byWeight) {
    if (Number.isFinite(weight) && weight > 0) {
      amount = `${formatNumber(weight)} טון`;
    }
    if (Number.isFinite(pricePerTon) && pricePerTon > 0) {
      unitPrice = formatNumber(pricePerTon);
    }
  } else {
    if (Number.isFinite(quantity) && quantity > 0) {
      amount = `${formatNumber(quantity)} יח׳`;
    }
    if (Number.isFinite(pricePerUnit) && pricePerUnit > 0) {
      unitPrice = formatNumber(pricePerUnit);
    }
  }

  return {
    date: formatBillDate(row.date),
    description: String(row.baleName ?? ""),
    amount,
    unitPrice,
    transportPrice:
      Number.isFinite(transport) && transport > 0
        ? formatNumber(transport)
        : "",
    price: Number(row.finalPrice ?? 0),
    priceFormatted: formatNumber(row.finalPrice ?? 0),
  };
}

function buildSection(
  title: string,
  layout: CustomerBillSectionLayout,
  lines: CustomerBillLine[],
): CustomerBillSection | null {
  if (lines.length === 0) return null;
  const sorted = [...lines].sort(compareByDate);
  const subtotal = sorted.reduce((sum, item) => sum + item.price, 0);
  return {
    title,
    layout,
    lines: sorted,
    subtotal: Number(subtotal.toFixed(2)),
    subtotalFormatted: formatNumber(subtotal),
  };
}

export function buildCustomerBillDocumentFromRows(input: {
  customerName: string;
  billDate?: string;
  showPlots?: boolean;
  operations: CollectionDocument[];
  contractors: CollectionDocument[];
  materialUsage: CollectionDocument[];
  baleOrders: CollectionDocument[];
}): CustomerBillDocument {
  const showPlots = input.showPlots !== false;
  const operationsSection = buildSection("פעולות", "operations", [
    ...input.operations.map(operationLine),
    ...input.contractors.map(contractorLine),
  ]);
  const materialsSection = buildSection(
    "חומרים",
    "quantityWithUnitPrice",
    input.materialUsage.map((row) => materialLine(row, showPlots)),
  );
  const balesSection = buildSection(
    "הזמנת חבילות",
    "quantityWithUnitPrice",
    input.baleOrders.map(baleLine),
  );

  const sections = [operationsSection, materialsSection, balesSection].filter(
    (section): section is CustomerBillSection => section != null,
  );
  const total = sections.reduce((sum, section) => sum + section.subtotal, 0);

  return {
    customerName: input.customerName,
    billDate: input.billDate ?? todayBillDate(),
    showPlots,
    sections,
    total: Number(total.toFixed(2)),
    totalFormatted: formatNumber(total),
  };
}

export function buildCustomerBillDocumentFromPreview(input: {
  customerName: string;
  customerId: string;
  showPlots?: boolean;
  operations: CollectionDocument[];
  contractors: CollectionDocument[];
  materialUsage: CollectionDocument[];
  baleOrders: CollectionDocument[];
}): CustomerBillDocument {
  const { customerId } = input;
  const operations = input.operations.filter((row) =>
    isUnbilledOperationForCustomer(row, customerId),
  );
  const contractors = input.contractors.filter((row) =>
    isUnbilledContractorForCustomer(row, customerId),
  );
  const materialUsage = input.materialUsage.filter((row) =>
    isUnbilledMaterialUsageForCustomer(row, customerId),
  );
  const baleOrders = input.baleOrders.filter((row) =>
    isUnbilledBaleOrderForCustomer(row, customerId),
  );

  return buildCustomerBillDocumentFromRows({
    customerName: input.customerName,
    showPlots: input.showPlots,
    operations,
    contractors,
    materialUsage,
    baleOrders,
  });
}
