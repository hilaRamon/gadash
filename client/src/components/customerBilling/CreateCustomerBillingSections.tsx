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
import { useUpdateDocument } from "@/hooks/collections/useCollectionMutations";
import { useCollectionList } from "@/hooks/collections/useCollectionList";
import { collectionKeys, customerBillingKeys } from "@/lib/queryKeys";
import type { CollectionDocument, CollectionSchema } from "@/schema/types";
import { countCustomerPlots, type UnbilledPreview } from "@/lib/customerBillingApi";
import { isTransportBillingRow } from "@/lib/transportTrackingBilling";
import { CustomerBillPaper } from "./CustomerBillPaper";
import { PreviewSection, type PreviewSectionProps } from "./PreviewSection";
import {
  balePreviewSchema,
  contractorPreviewSchema,
  materialPreviewSchema,
  operationsPreviewSchema,
  withoutPlotColumn,
} from "./billingPreviewSchemas";

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
      onCellChange?: PreviewSectionProps["onCellChange"];
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

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? 'var(--color-error-text)' : 'var(--text-secondary)')};
`;
