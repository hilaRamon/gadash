import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "../collection/DataTable/DataTable";
import { useTableQueryState } from "../../hooks/useTableQueryState";
import { useUpdateDocument } from "../../hooks/collections/useCollectionMutations";
import { collectionKeys, customerBillingKeys } from "../../lib/queryKeys";
import type { CollectionDocument, CollectionSchema } from "../../schema/types";
import { operationsTrackingsAllSchema } from "../../schema/collections/operationsTrackingsSchema";
import { materialUsageTrackingsSchema } from "../../schema/collections/materialUsageTrackingsSchema";
import { baleOrderTrackingsSchema } from "../../schema/collections/baleOrderTrackingsSchema";
import { contractorTrackingsSchema } from "../../schema/collections/contractorTrackingsSchema";
import type { UnbilledPreview } from "../../lib/customerBillingApi";
import { formatNumber } from "../../lib/formatNumber";
import type { ColumnDef } from "../../schema/types";
import { CustomerBillPaper } from "./CustomerBillPaper";

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

const operationsPreviewSchema: CollectionSchema = {
  ...operationsTrackingsAllSchema,
  columns: [
    ...pickPreviewColumns(operationsTrackingsAllSchema, [
      "date",
      "operation",
      "plot",
    ]),
    {
      key: "unitCost",
      label: "מחיר לדונם",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "dunam",
      label: "דונם",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "6rem",
    },
    ...pickPreviewColumns(operationsTrackingsAllSchema, ["finalPrice"]),
  ],
};

const materialPreviewSchema = pickPreviewSchema(materialUsageTrackingsSchema, [
  "date",
  "material",
  "plot",
  "amount",
  "finalPrice",
]);

const balePreviewSchema = pickPreviewSchema(baleOrderTrackingsSchema, [
  "date",
  "bale",
  "quantity",
  "pricePerTon",
  "pricePerUnit",
  "weight",
  "finalPrice",
]);

const contractorPreviewColumnKeys = [
  "date",
  "contractor",
  "plot",
  "operation",
  "finalPrice",
  "customerPrice",
];

const contractorPreviewSchema: CollectionSchema = {
  ...pickPreviewSchema(contractorTrackingsSchema, contractorPreviewColumnKeys),
  columns: pickPreviewColumns(contractorTrackingsSchema, contractorPreviewColumnKeys).map(
    (col) =>
      col.key === "customerPrice"
        ? { ...col, inlineEditable: () => true, nullable: true }
        : col,
  ),
};

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
  const [includedIds, setIncludedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
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

  const handleContractorCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      if (key !== "customerPrice") return;
      await updateContractor.mutateAsync({
        id: row._id,
        body: { customerPrice: value },
      });
      await queryClient.invalidateQueries({
        queryKey: customerBillingKeys.unbilledPreview(customerId),
      });
      await queryClient.invalidateQueries({
        queryKey: collectionKeys.list("contractorTrackings"),
      });
    },
    [customerId, queryClient, updateContractor],
  );

  const allSections = useMemo<
    (SectionConfig & {
      onCellChange?: SectionProps["onCellChange"];
    })[]
  >(
    () => [
      {
        title: "פעולות",
        schema: operationsPreviewSchema,
        rows: preview?.operations ?? [],
      },
      {
        title: "שימוש בחומרים",
        schema: materialPreviewSchema,
        rows: preview?.materialUsage ?? [],
      },
      {
        title: "הזמנות חציר",
        schema: balePreviewSchema,
        rows: preview?.baleOrders ?? [],
      },
      {
        title: "עבודות קבלן",
        schema: contractorPreviewSchema,
        rows: preview?.contractors ?? [],
        onCellChange: handleContractorCellChange,
      },
    ],
    [preview, handleContractorCellChange],
  );

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
  color: ${({ $error }) => ($error ? "#fc8181" : "var(--text-secondary)")};
`;
