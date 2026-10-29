/**
 * Create-billing UI: receives UnbilledPreview from the parent page and renders four
 * selectable DataTables (operations, materials, bales, contractors) plus CustomerBillPaper.
 *
 * Does not fetch preview itself — only maps preview.* arrays to table rows and column schemas.
 * Bill HTML is loaded separately inside CustomerBillPaper based on checked row IDs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateDocument } from "@/queries/collections/useCollectionMutations";
import { useCollectionList } from "@/queries/collections/useCollectionList";
import { collectionKeys, customerBillingKeys } from "@/queries/queryKeys";
import type { CollectionDocument, CollectionSchema } from "@/schema/types";
import { countCustomerPlots, type UnbilledPreview } from "@/api/customerBillingApi";
import { isByWeightPricing } from "@/lib/baleOrderPricing";
import { isTransportBillingRow } from "@/lib/transportTrackingBilling";
import { isGlobalTransportAllocationRow } from "@/lib/transportGlobalAllocationBilling";
import {
  DiscountedUnitCostWarning,
  requestDiscountedUnitCostEdit,
  type DiscountedUnitCostEdit,
} from "@/components/collection/DiscountedUnitCostWarning";
import { getApiErrorMessage } from "@/lib/apiErrorMessage";
import { CustomerBillPaper } from "./CustomerBillPaper";
import { OperationDiscountModal, type DiscountType } from "./OperationDiscountModal";
import { buildBalesBillingSchema } from "./balesBillingSchema";
import { buildOperationsBillingSchema } from "./operationsBillingSchema";
import { PreviewSection, type PreviewSectionProps } from "./PreviewSection";
import {
  contractorPreviewSchema,
  materialPreviewSchema,
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
  const updateTransport = useUpdateDocument("transportTrackings");
  const updateOperationTracking = useUpdateDocument("operationsTrackings");
  const updateMaterialUsage = useUpdateDocument("materialUsageTrackings");
  const updateBaleOrder = useUpdateDocument("baleOrderTrackings");
  const { data: plots } = useCollectionList("plots");
  const showPlots = plots == null || countCustomerPlots(plots, customerId) > 1;
  const [includedIds, setIncludedIds] = useState<Set<string>>(() => new Set());
  const [discountRow, setDiscountRow] = useState<CollectionDocument | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [pendingUnitCostEdit, setPendingUnitCostEdit] =
    useState<DiscountedUnitCostEdit | null>(null);
  const [cancelDiscountError, setCancelDiscountError] = useState<string | null>(
    null,
  );
  const [cancelingDiscountId, setCancelingDiscountId] = useState<string | null>(
    null,
  );
  const cancelingDiscountIdRef = useRef<string | null>(null);
  const [baleDiscountRow, setBaleDiscountRow] = useState<CollectionDocument | null>(
    null,
  );
  const [baleDiscountError, setBaleDiscountError] = useState<string | null>(null);
  const [cancelingBaleDiscountId, setCancelingBaleDiscountId] = useState<
    string | null
  >(null);
  const cancelingBaleDiscountIdRef = useRef<string | null>(null);
  const [baleCancelDiscountError, setBaleCancelDiscountError] = useState<
    string | null
  >(null);

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
      if (key === "unitCost" && row.isDiscount === true) {
        const unitCost = Number(value);
        if (!Number.isFinite(unitCost)) return;
        await requestDiscountedUnitCostEdit(
          setPendingUnitCostEdit,
          row._id,
          unitCost,
        );
        await refreshBillingPreviews();
        return;
      }
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

  const handleCancelDiscount = useCallback(
    async (row: CollectionDocument) => {
      const unitCost = Number(row.priceBeforeDiscount);
      if (!Number.isFinite(unitCost) || unitCost < 0) return;
      if (cancelingDiscountIdRef.current) return;
      cancelingDiscountIdRef.current = row._id;
      setCancelingDiscountId(row._id);
      setCancelDiscountError(null);
      try {
        await updateOperationTracking.mutateAsync({
          id: row._id,
          body: { unitCost, isDiscount: false },
        });
        await refreshBillingPreviews();
      } catch (err) {
        setCancelDiscountError(getApiErrorMessage(err, "שגיאה בביטול ההנחה"));
      } finally {
        cancelingDiscountIdRef.current = null;
        setCancelingDiscountId(null);
      }
    },
    [refreshBillingPreviews, updateOperationTracking],
  );

  const handleApproveDiscount = useCallback(
    async (discountType: DiscountType, discountValue: number) => {
      if (!discountRow) return;
      setDiscountError(null);
      try {
        await updateOperationTracking.mutateAsync({
          id: discountRow._id,
          body: { discountType, discountValue },
        });
        setDiscountRow(null);
        await refreshBillingPreviews();
      } catch (err) {
        setDiscountError(getApiErrorMessage(err, "שגיאה בשמירת ההנחה"));
      }
    },
    [discountRow, refreshBillingPreviews, updateOperationTracking],
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

  const handleCancelBaleDiscount = useCallback(
    async (row: CollectionDocument) => {
      const price = Number(row.priceBeforeDiscount);
      if (!Number.isFinite(price) || price < 0) return;
      if (cancelingBaleDiscountIdRef.current) return;
      const priceKey = isByWeightPricing(row.pricingForm)
        ? "pricePerTon"
        : "pricePerUnit";
      cancelingBaleDiscountIdRef.current = row._id;
      setCancelingBaleDiscountId(row._id);
      setBaleCancelDiscountError(null);
      try {
        await updateBaleOrder.mutateAsync({
          id: row._id,
          body: { [priceKey]: price, isDiscount: false },
        });
        await refreshBillingPreviews();
      } catch (err) {
        setBaleCancelDiscountError(getApiErrorMessage(err, "שגיאה בביטול ההנחה"));
      } finally {
        cancelingBaleDiscountIdRef.current = null;
        setCancelingBaleDiscountId(null);
      }
    },
    [refreshBillingPreviews, updateBaleOrder],
  );

  const handleApproveBaleDiscount = useCallback(
    async (discountType: DiscountType, discountValue: number) => {
      if (!baleDiscountRow) return;
      setBaleDiscountError(null);
      try {
        await updateBaleOrder.mutateAsync({
          id: baleDiscountRow._id,
          body: { discountType, discountValue },
        });
        setBaleDiscountRow(null);
        await refreshBillingPreviews();
      } catch (err) {
        setBaleDiscountError(getApiErrorMessage(err, "שגיאה בשמירת ההנחה"));
      }
    },
    [baleDiscountRow, refreshBillingPreviews, updateBaleOrder],
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
      if (key !== "unitCustomerPrice") return;
      if (isGlobalTransportAllocationRow(row)) return;
      if (isTransportBillingRow(row)) {
        await updateTransport.mutateAsync({
          id: row._id,
          body: { customerHourlyRate: value },
        });
        await refreshBillingPreviews();
        await queryClient.invalidateQueries({
          queryKey: collectionKeys.list("transportTrackings"),
        });
        return;
      }
      await updateContractor.mutateAsync({
        id: row._id,
        body: { unitCustomerPrice: value },
      });
      await refreshBillingPreviews();
      await queryClient.invalidateQueries({
        queryKey: collectionKeys.list("contractorTrackings"),
      });
    },
    [queryClient, refreshBillingPreviews, updateContractor, updateTransport],
  );

  // Split server preview into four sections; each array becomes one DataTable.
  const allSections = useMemo<
    (SectionConfig & {
      onCellChange?: PreviewSectionProps["onCellChange"];
    })[]
  >(() => {
    const sectionSchema = (schema: CollectionSchema) =>
      showPlots ? schema : withoutPlotColumn(schema);
    const showDiscountColumns = (preview?.operations ?? []).some(
      (row) => row.isDiscount === true,
    );
    return [
      {
        title: "פעולות",
        schema: buildOperationsBillingSchema({
          showPlots,
          showDiscountColumns,
          onOpenDiscount: (row) => {
            setDiscountError(null);
            setDiscountRow(row);
          },
          cancelingDiscountId,
          onCancelDiscount: (row) => {
            void handleCancelDiscount(row);
          },
          onUnitCostChange: (row, value) =>
            handleOperationCellChange(row, "unitCost", value),
        }),
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
        schema: buildBalesBillingSchema({
          showDiscountColumns: (preview?.baleOrders ?? []).some(
            (row) => row.isDiscount === true,
          ),
          onOpenDiscount: (row) => {
            setBaleDiscountError(null);
            setBaleDiscountRow(row);
          },
          cancelingDiscountId: cancelingBaleDiscountId,
          onCancelDiscount: (row) => {
            void handleCancelBaleDiscount(row);
          },
          onPriceChange: (row, key, value) =>
            handleBaleCellChange(row, key, value),
        }),
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
    handleCancelDiscount,
    cancelingDiscountId,
    handleMaterialCellChange,
    handleBaleCellChange,
    handleCancelBaleDiscount,
    cancelingBaleDiscountId,
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
      {cancelDiscountError && (
        <StatusText $error role="alert">
          {cancelDiscountError}
        </StatusText>
      )}
      {baleCancelDiscountError && (
        <StatusText $error role="alert">
          {baleCancelDiscountError}
        </StatusText>
      )}
      {nonEmptySections.map((section) => (
        <PreviewSection
          key={section.title}
          {...section}
          includedIds={includedIds}
          onToggleInclude={onToggleInclude}
          onToggleIncludeAll={onToggleIncludeAll}
        />
      ))}
      <DiscountedUnitCostWarning pending={pendingUnitCostEdit} />
      <OperationDiscountModal
        open={discountRow != null}
        row={discountRow}
        isPending={updateOperationTracking.isPending}
        error={discountError}
        onClose={() => {
          if (updateOperationTracking.isPending) return;
          setDiscountRow(null);
          setDiscountError(null);
        }}
        onApprove={(discountType, discountValue) => {
          void handleApproveDiscount(discountType, discountValue);
        }}
      />
      <OperationDiscountModal
        open={baleDiscountRow != null}
        row={baleDiscountRow}
        isPending={updateBaleOrder.isPending}
        error={baleDiscountError}
        onClose={() => {
          if (updateBaleOrder.isPending) return;
          setBaleDiscountRow(null);
          setBaleDiscountError(null);
        }}
        onApprove={(discountType, discountValue) => {
          void handleApproveBaleDiscount(discountType, discountValue);
        }}
      />
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
