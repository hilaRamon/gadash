/**
 * Create-billing UI: receives UnbilledPreview from the parent page and renders four
 * selectable DataTables (operations, materials, bales, contractors) plus CustomerBillPaper.
 *
 * Does not fetch preview itself — only maps preview.* arrays to table rows and column schemas.
 * Bill HTML is loaded separately inside CustomerBillPaper based on checked row IDs.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "../collection/DataTable/DataTable";
import { useTableQueryState } from "../../hooks/useTableQueryState";
import { useUpdateDocument } from "../../hooks/collections/useCollectionMutations";
import { useCollectionList } from "../../hooks/collections/useCollectionList";
import { collectionKeys, customerBillingKeys } from "../../lib/queryKeys";
import type { CollectionDocument, CollectionSchema, ColumnDef } from "../../schema/types";
import { operationsTrackingsAllSchema } from "../../schema/collections/operationsTrackingsSchema";
import { materialUsageTrackingsSchema } from "../../schema/collections/materialUsageTrackingsSchema";
import { baleOrderTrackingsSchema } from "../../schema/collections/baleOrderTrackingsSchema";
import { contractorTrackingsSchema } from "../../schema/collections/contractorTrackingsSchema";
import { countCustomerPlots, type UnbilledPreview } from "../../lib/customerBillingApi";
import { isTransportBillingRow } from "../../lib/transportTrackingBilling";
import {
  BALE_ORDER_BY_UNIT,
  isByWeightPricing,
} from "../../lib/baleOrderPricing";
import { formatNumber } from "../../lib/formatNumber";
import { CustomerBillPaper } from "./CustomerBillPaper";

// Subset of collection columns shown in each preview table (search disabled).
function pickPreviewColumns(
  schema: CollectionSchema,
  columnKeys: string[],
): ColumnDef[] {
  return columnKeys
    .map((key) => schema.columns.find((col) => col.key === key))
    .filter((col): col is ColumnDef => col != null)
    .map((col) => ({ ...col, searchable: false }));
}

function pickPreviewSchema(
  schema: CollectionSchema,
  columnKeys: string[],
): CollectionSchema {
  return {
    ...schema,
    columns: pickPreviewColumns(schema, columnKeys),
  };
}

function markColumnsEditable(
  schema: CollectionSchema,
  keys: string[],
  options?: { nullableKeys?: string[] },
): CollectionSchema {
  const nullable = new Set(options?.nullableKeys ?? []);
  return {
    ...schema,
    columns: schema.columns.map((col) =>
      keys.includes(col.key)
        ? {
            ...col,
            inlineEditable: () => true,
            ...(nullable.has(col.key) ? { nullable: true } : {}),
          }
        : col,
    ),
  };
}

const operationPricingFormOptions = [
  { value: "דונם", label: "דונם" },
  { value: "שעתי", label: "שעתי" },
  { value: "כמות יחידות", label: "כמות יחידות" },
] as const;

const operationsPreviewSchema: CollectionSchema = markColumnsEditable(
  {
  // Column layout for the operations preview table (not sent by the server).
  ...operationsTrackingsAllSchema,
  columns: [
    ...pickPreviewColumns(operationsTrackingsAllSchema, [
      "date",
      "operation",
      "plot",
    ]),
    {
      key: "pricingForm",
      label: "צורת תמחור",
      type: "enum",
      enumOptions: [...operationPricingFormOptions],
      width: "8rem",
      inlineEditable: () => false,
    },
    {
      key: "unitCost",
      label: "מחיר ליחידה",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "amount",
      label: "כמות",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "6rem",
    },
    ...pickPreviewColumns(operationsTrackingsAllSchema, ["finalPrice"]),
  ],
  },
  ["unitCost", "amount"],
);

const materialPreviewSchema: CollectionSchema = markColumnsEditable(
  {
  ...materialUsageTrackingsSchema,
  columns: [
    ...pickPreviewColumns(materialUsageTrackingsSchema, [
      "date",
      "material",
      "plot",
      "amount",
      "unitPrice",
    ]),
    ...pickPreviewColumns(materialUsageTrackingsSchema, ["finalPrice"]),
  ],
  },
  ["unitPrice", "amount"],
);

function markBalePreviewColumnsEditable(schema: CollectionSchema): CollectionSchema {
  const nullable = new Set(["weight", "transportPrice"]);
  const editableKeys = new Set([
    "pricePerTon",
    "quantity",
    "weight",
    "pricePerUnit",
    "transportPrice",
  ]);

  return {
    ...schema,
    columns: schema.columns.map((col) => {
      if (col.key === "pricingForm") {
        return { ...col, inlineEditable: () => false };
      }
      if (!editableKeys.has(col.key)) return col;

      let inlineEditable: (row: CollectionDocument) => boolean;
      switch (col.key) {
        case "pricePerTon":
        case "weight":
          inlineEditable = (row) => isByWeightPricing(row.pricingForm);
          break;
        case "pricePerUnit":
          inlineEditable = (row) =>
            String(row.pricingForm ?? "") === BALE_ORDER_BY_UNIT;
          break;
        default:
          inlineEditable = () => true;
      }

      return {
        ...col,
        inlineEditable,
        ...(nullable.has(col.key) ? { nullable: true } : {}),
      };
    }),
  };
}

const balePreviewSchema: CollectionSchema = markBalePreviewColumnsEditable({
  ...baleOrderTrackingsSchema,
  columns: [
    ...pickPreviewColumns(baleOrderTrackingsSchema, [
      "date",
      "bale",
      "quantity",
      "pricingForm",
      "pricePerTon",
      "pricePerUnit",
      "weight",
      "transportPrice",
    ]),
    ...pickPreviewColumns(baleOrderTrackingsSchema, ["finalPrice"]),
  ],
});

const contractorUnitPriceColumn: ColumnDef = {
  key: "unitPrice",
  label: "מחיר ליחידה",
  type: "number",
  sortable: true,
  getValue: (row) => Number(row.unitPrice ?? 0),
  format: (value) => formatNumber(value),
  width: "8rem",
  searchable: false,
};

const contractorUnitCustomerPriceColumn: ColumnDef = {
  key: "unitCustomerPrice",
  label: "מחיר ללקוח ליחידה",
  type: "number",
  sortable: true,
  format: (value) =>
    value == null || value === "" ? "—" : formatNumber(value),
  width: "8rem",
  searchable: false,
};

const contractorUnitAmountColumn: ColumnDef = {
  key: "unitAmount",
  label: "כמות",
  type: "number",
  sortable: true,
  getValue: (row) => Number(row.unitAmount ?? 0),
  format: (value) => formatNumber(value),
  width: "6rem",
  searchable: false,
};

const contractorPreviewSchema: CollectionSchema = {
  ...pickPreviewSchema(contractorTrackingsSchema, [
    "date",
    "contractor",
    "plot",
    "operation",
    "customerFinalPrice",
  ]),
  columns: [
    ...pickPreviewColumns(contractorTrackingsSchema, [
      "date",
      "contractor",
      "plot",
      "operation",
    ]),
    ...pickPreviewColumns(contractorTrackingsSchema, ["pricingForm"]),
    contractorUnitPriceColumn,
    {
      ...contractorUnitCustomerPriceColumn,
      inlineEditable: (row) => !isTransportBillingRow(row),
      nullable: true,
    },
    contractorUnitAmountColumn,
    ...pickPreviewColumns(contractorTrackingsSchema, ["customerFinalPrice"]),
  ],
};

function withoutPlotColumn(schema: CollectionSchema): CollectionSchema {
  return {
    ...schema,
    columns: schema.columns.filter((col) => col.key !== "plot"),
  };
}

function collectPreviewRowIds(preview: UnbilledPreview): string[] {
  return [
    ...preview.operations,
    ...preview.materialUsage,
    ...preview.baleOrders,
    ...preview.contractors,
  ].map((row) => row._id);
}

type SectionConfig = {
  title: string;
  schema: CollectionSchema;
  rows: CollectionDocument[];
};

type SectionProps = SectionConfig & {
  includedIds: Set<string>;
  onToggleInclude: (id: string) => void;
  onToggleIncludeAll: (ids: string[], included: boolean) => void;
  onCellChange?: (
    row: CollectionDocument,
    key: string,
    value: unknown,
  ) => void | Promise<void>;
};

function PreviewSection({
  title,
  schema,
  rows,
  includedIds,
  onToggleInclude,
  onToggleIncludeAll,
  onCellChange,
}: SectionProps) {
  const tableQuery = useTableQueryState(schema);
  const noop = () => {};

  const includeSelection = useMemo(
    () => ({
      isIncluded: (id: string) => includedIds.has(id),
      onToggleInclude,
      onToggleIncludeAll: (ids: string[]) => {
        const allIncluded =
          ids.length > 0 && ids.every((id) => includedIds.has(id));
        onToggleIncludeAll(ids, !allIncluded);
      },
    }),
    [includedIds, onToggleInclude, onToggleIncludeAll],
  );

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <SectionCount>{rows.length} פריטים</SectionCount>
      </SectionHeader>
      <DataTable
        schema={schema}
        rows={rows}
        queryState={tableQuery.state}
        onColumnSearchChange={tableQuery.setColumnSearch}
        onToggleSelect={noop}
        onToggleSelectAll={noop}
        onEdit={noop}
        onDelete={noop}
        onCellChange={onCellChange}
        previewMode
        previewIncludeSelection={includeSelection}
      />
    </Section>
  );
}

type CreateCustomerBillingSectionsProps = {
  customerId: string;
  customerName: string;
  preview: UnbilledPreview | undefined;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
};

export function CreateCustomerBillingSections({
  customerId,
  customerName,
  preview,
  isLoading,
  isError,
  errorMessage,
}: CreateCustomerBillingSectionsProps) {
  const queryClient = useQueryClient();
  const updateContractor = useUpdateDocument("contractorTrackings");
  const updateOperationTracking = useUpdateDocument("operationsTrackings");
  const updateMaterialUsage = useUpdateDocument("materialUsageTrackings");
  const updateBaleOrder = useUpdateDocument("baleOrderTrackings");
  const { data: plots } = useCollectionList("plots");
  const showPlots = plots == null || countCustomerPlots(plots, customerId) > 1;
  const [includedIds, setIncludedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Default: all preview rows are included in the bill until the user unchecks them.
    if (!preview) {
      setIncludedIds(new Set());
      return;
    }
    setIncludedIds(new Set(collectPreviewRowIds(preview)));
  }, [preview]);

  const onToggleInclude = useCallback((id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleIncludeAll = useCallback((ids: string[], included: boolean) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (included) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const refreshBillingPreviews = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: customerBillingKeys.unbilledPreview(customerId),
    });
    await queryClient.refetchQueries({
      queryKey: customerBillingKeys.unbilledPreview(customerId),
    });
    await queryClient.invalidateQueries({
      queryKey: customerBillingKeys.billPreviewForCustomer(customerId),
    });
  }, [customerId, queryClient]);

  const handleOperationCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      if (key === "unitCost" || key === "amount") {
        await updateOperationTracking.mutateAsync({
          id: row._id,
          body: { [key]: value },
        });
      } else {
        return;
      }
      await refreshBillingPreviews();
    },
    [refreshBillingPreviews, updateOperationTracking],
  );

  const handleMaterialCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      if (key !== "unitPrice" && key !== "amount") return;
      await updateMaterialUsage.mutateAsync({
        id: row._id,
        body: { [key]: value },
      });
      await refreshBillingPreviews();
    },
    [refreshBillingPreviews, updateMaterialUsage],
  );

  const handleBaleCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      const editableKeys = [
        "pricePerTon",
        "quantity",
        "weight",
        "pricePerUnit",
        "transportPrice",
      ];
      if (!editableKeys.includes(key)) return;
      await updateBaleOrder.mutateAsync({
        id: row._id,
        body: { [key]: value },
      });
      await refreshBillingPreviews();
    },
    [refreshBillingPreviews, updateBaleOrder],
  );

  const handleContractorCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      if (key !== "unitCustomerPrice" || isTransportBillingRow(row)) return;
      await updateContractor.mutateAsync({
        id: row._id,
        body: { unitCustomerPrice: value },
      });
      await refreshBillingPreviews();
      await queryClient.invalidateQueries({
        queryKey: collectionKeys.list("contractorTrackings"),
      });
    },
    [queryClient, refreshBillingPreviews, updateContractor],
  );

  // Split server preview into four sections; each array becomes one DataTable.
  const allSections = useMemo<
    (SectionConfig & {
      onCellChange?: SectionProps["onCellChange"];
    })[]
  >(() => {
    const sectionSchema = (schema: CollectionSchema) =>
      showPlots ? schema : withoutPlotColumn(schema);
    return [
      {
        title: "פעולות",
        schema: sectionSchema(operationsPreviewSchema),
        rows: preview?.operations ?? [],
        onCellChange: handleOperationCellChange,
      },
      {
        title: "שימוש בחומרים",
        schema: sectionSchema(materialPreviewSchema),
        rows: preview?.materialUsage ?? [],
        onCellChange: handleMaterialCellChange,
      },
      {
        title: "הזמנות חציר",
        schema: balePreviewSchema,
        rows: preview?.baleOrders ?? [],
        onCellChange: handleBaleCellChange,
      },
      {
        title: "עבודות קבלן",
        schema: sectionSchema(contractorPreviewSchema),
        rows: preview?.contractors ?? [],
        onCellChange: handleContractorCellChange,
      },
    ];
  }, [
    preview,
    showPlots,
    handleOperationCellChange,
    handleMaterialCellChange,
    handleBaleCellChange,
    handleContractorCellChange,
  ]);

  const nonEmptySections = useMemo(
    () => allSections.filter((section) => section.rows.length > 0),
    [allSections],
  );

  if (isLoading) {
    return <StatusText>טוען פריטים...</StatusText>;
  }

  if (isError) {
    return (
      <StatusText $error role="alert">
        {errorMessage ?? "שגיאה בטעינת פריטים"}
      </StatusText>
    );
  }

  if (nonEmptySections.length === 0) {
    return <StatusText>אין פריטים לחיוב עבור לקוח זה</StatusText>;
  }

  return (
    <SectionsStack>
      {nonEmptySections.map((section) => (
        <PreviewSection
          key={section.title}
          {...section}
          includedIds={includedIds}
          onToggleInclude={onToggleInclude}
          onToggleIncludeAll={onToggleIncludeAll}
        />
      ))}
      {preview && (
        <CustomerBillPaper
          customerId={customerId}
          customerName={customerName}
          preview={preview}
          includedIds={includedIds}
        />
      )}
    </SectionsStack>
  );
}

const SectionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
  max-width: 100%;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const SectionCount = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
`;

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? 'var(--color-error-text)' : 'var(--text-secondary)')};
`;
