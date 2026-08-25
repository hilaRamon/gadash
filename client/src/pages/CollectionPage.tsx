import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getCollectionSchema } from "@/schema/registry";
import type { CollectionSchema } from "@/schema/types";
import { getDocumentLabel } from "@/lib/documentLabel";
import { exportCollectionToExcel } from "@/lib/excel/exportCollectionExcel";
import { listCollectionAllForExport } from "@/api/collectionApi";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCollectionList } from "@/queries/collections/useCollectionList";
import { useSeason } from "@/context/SeasonContext";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDeleteDocuments,
} from "@/queries/collections/useCollectionMutations";
import { CollectionToolbar } from "@/components/collection/CollectionToolbar";
import {
  PageHeader,
  PageHeaderTop,
  PageTitle,
} from "@/components/page/PageHeaderLayout";
import { DataTable } from "@/components/collection/DataTable";
import { Pagination } from "@/components/collection/Pagination";
import { CollectionFormModal } from "@/components/collection/CollectionFormModal";
import { ConfirmDialog } from "@/components/collection/ConfirmDialog";
import { TransportTrackingPageExtras } from "@/components/transport/TransportTrackingPageExtras";
import { TransportGlobalChargePageExtras } from "@/components/transport/TransportGlobalChargePageExtras";
import { InvoiceMonthlySummary } from "@/components/invoices/InvoiceMonthlySummary";
import { InvoiceViewModal } from "@/components/invoices/InvoiceViewModal";
import { GlobalTransportChargeViewModal } from "@/components/transport/GlobalTransportChargeViewModal";
import { CustomerBillingViewModal } from "@/components/customerBilling/CustomerBillingViewModal";
import { uploadInvoiceFile } from "@/api/invoiceApi";
import { useQueryClient } from "@tanstack/react-query";
import { collectionKeys } from "@/queries/queryKeys";
import { useGlobalChargeModalControls } from "@/hooks/transport/useGlobalChargeModalControls";
import {
  GLOBAL_TRANSPORT_BILLING_DELETE_TOOLTIP,
  PAID_BILLING_DELETE_TOOLTIP,
} from "@/lib/customerBillingErrors";
import { isChargedTracking } from "@/lib/chargedTracking";
import {
  CHARGED_TRACKING_DELETE_ERROR,
  CHARGED_TRACKING_DELETE_TOOLTIP,
  CHARGED_TRACKING_EDIT_ERROR,
} from "@/lib/chargedTrackingErrors";
import { toQueryParams } from "@/schema/tableQuery";
import type { ListCollectionParams } from "@/api/listCollectionParams";
import { collectionHasDateField } from "@/lib/seasonRange";
import type { CollectionDocument } from "@/schema/types";
import "./Page.css";

type CollectionPageProps = {
  collectionId: string;
};

type DeleteTarget =
  | { type: "single"; row: CollectionDocument }
  | { type: "bulk"; ids: string[] }
  | null;

const DEFAULT_PAGE_SIZE = 50;

function getMutationErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } })
      .response;
    if (response?.data?.error) return response.data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function resolveOperationScope(
  collectionId: string,
): ListCollectionParams["operationScope"] | undefined {
  if (collectionId === "operations-trackings-field-work") return "fieldWork";
  if (collectionId === "operations-trackings-admin") return "admin";
  if (collectionId === "operations-trackings-all") return "excludeFuel";
  return undefined;
}

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const schema = getCollectionSchema(collectionId);

  if (!schema) {
    return (
      <div className="page">
        <h1 className="page-title">לא נמצא</h1>
      </div>
    );
  }

  return (
    <CollectionPageContent
      key={schema.id}
      schema={schema}
      collectionId={collectionId}
    />
  );
}

function CollectionPageContent({
  schema,
  collectionId,
}: {
  schema: CollectionSchema;
  collectionId: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedSeasonYear } = useSeason();
  const tableQuery = useTableQueryState(schema);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CollectionDocument | null>(null);
  const [viewingBillingRow, setViewingBillingRow] =
    useState<CollectionDocument | null>(null);
  const [viewingGlobalChargeId, setViewingGlobalChargeId] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [viewingInvoiceRow, setViewingInvoiceRow] =
    useState<CollectionDocument | null>(null);
  const [pendingInvoiceFile, setPendingInvoiceFile] = useState<File | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

  const queryParams = useMemo(
    () => toQueryParams(tableQuery.state),
    [tableQuery.state],
  );
  const debouncedSearch = useDebouncedValue(queryParams.search ?? "", 300);
  const columnSearchKey = useMemo(
    () => JSON.stringify(queryParams.q ?? {}),
    [queryParams.q],
  );
  const debouncedColumnSearchKey = useDebouncedValue(columnSearchKey, 300);
  const debouncedQ = useMemo(() => {
    const parsed = JSON.parse(debouncedColumnSearchKey) as Record<string, string>;
    return Object.keys(parsed).length > 0 ? parsed : undefined;
  }, [debouncedColumnSearchKey]);
  const operationScope = resolveOperationScope(collectionId);

  const listParams = useMemo(
    (): ListCollectionParams & { page: number; pageSize: number } => {
      const usesSeason =
        collectionHasDateField(schema.collection) ||
        schema.collection === "transportGlobalCharges";
      return {
        season: usesSeason ? selectedSeasonYear : undefined,
        page,
        pageSize,
        sort: queryParams.sort,
        search: debouncedSearch || undefined,
        q: debouncedQ,
        filter: queryParams.filter,
        operationScope,
      };
    },
    [
      schema.collection,
      selectedSeasonYear,
      page,
      pageSize,
      queryParams.sort,
      queryParams.filter,
      debouncedSearch,
      debouncedQ,
      operationScope,
    ],
  );

  // Reset page / selection when the filter query changes (not when page alone changes)
  useEffect(() => {
    setPage(1);
    tableQuery.resetSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit page
  }, [
    selectedSeasonYear,
    pageSize,
    queryParams.sort,
    queryParams.filter,
    debouncedSearch,
    debouncedColumnSearchKey,
    operationScope,
  ]);

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useCollectionList(schema.collection, listParams);

  const rows = pageData?.items ?? [];
  const total = pageData?.total ?? 0;

  const isTransportTrackingPage = collectionId === "transport-trackings";
  const isInvoicesPage = collectionId === "invoices";
  const { data: transportAllRows = [] } = useCollectionList(
    schema.collection,
    { season: selectedSeasonYear },
    { enabled: isTransportTrackingPage },
  );

  const createMutation = useCreateDocument(schema.collection);
  const updateMutation = useUpdateDocument(schema.collection);
  const deleteMutation = useDeleteDocument(schema.collection);
  const bulkDeleteMutation = useBulkDeleteDocuments(schema.collection);

  const openCreate = useCallback(() => {
    setEditingRow(null);
    setFormError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: CollectionDocument) => {
    setEditingRow(row);
    setFormError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingRow(null);
    setFormError(null);
    setPendingInvoiceFile(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown> | Record<string, unknown>[]) => {
      setFormError(null);
      if (editingRow && isChargedTracking(editingRow)) {
        setFormError(CHARGED_TRACKING_EDIT_ERROR);
        return;
      }
      setIsSavingForm(true);
      try {
        let savedDoc: CollectionDocument | null = null;
        if (editingRow) {
          savedDoc = await updateMutation.mutateAsync({
            id: editingRow._id,
            body: values as Record<string, unknown>,
          });
        } else if (Array.isArray(values)) {
          for (const payload of values) {
            savedDoc = await createMutation.mutateAsync(payload);
          }
        } else {
          savedDoc = await createMutation.mutateAsync(values);
        }

        if (isInvoicesPage && pendingInvoiceFile && savedDoc) {
          await uploadInvoiceFile(savedDoc._id, pendingInvoiceFile);
          await queryClient.invalidateQueries({
            queryKey: collectionKeys.list(schema.collection),
          });
        }

        closeModal();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "שגיאה בשמירה");
      } finally {
        setIsSavingForm(false);
      }
    },
    [editingRow, updateMutation, createMutation, closeModal, isInvoicesPage, pendingInvoiceFile, queryClient, schema.collection],
  );

  const handleCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      if (isChargedTracking(row)) return;
      await updateMutation.mutateAsync({
        id: row._id,
        body: { [key]: value },
      });
    },
    [updateMutation],
  );

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const exportRows = await listCollectionAllForExport(schema.collection, {
        season: selectedSeasonYear,
        sort: queryParams.sort,
        search: debouncedSearch || undefined,
        q: debouncedQ,
        filter: queryParams.filter,
        operationScope,
      });
      exportCollectionToExcel(schema, exportRows);
    } finally {
      setExporting(false);
    }
  }, [
    schema,
    selectedSeasonYear,
    queryParams.sort,
    queryParams.filter,
    debouncedSearch,
    debouncedQ,
    operationScope,
  ]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    if (deleteTarget.type === "single") {
      if (isChargedTracking(deleteTarget.row)) {
        setDeleteError(CHARGED_TRACKING_DELETE_ERROR);
        return;
      }
    } else {
      const chargedSelected = deleteTarget.ids.some((id) => {
        const row = rows.find((r) => r._id === id);
        return row != null && isChargedTracking(row);
      });
      if (chargedSelected) {
        setDeleteError(CHARGED_TRACKING_DELETE_ERROR);
        return;
      }
    }

    try {
      if (deleteTarget.type === "single") {
        await deleteMutation.mutateAsync(deleteTarget.row._id);
      } else {
        await bulkDeleteMutation.mutateAsync(deleteTarget.ids);
        tableQuery.resetSelection();
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getMutationErrorMessage(err, "שגיאה במחיקה"));
    }
  }, [
    deleteTarget,
    deleteMutation,
    bulkDeleteMutation,
    tableQuery,
    rows,
  ]);

  const isGlobalChargePage = collectionId === "transport-global-charges";
  const isCustomerBillingPage = collectionId === "customer-billing-trackings";
  const globalChargeControls = useGlobalChargeModalControls(isGlobalChargePage);
  const canEditChargedTrackingRow = useCallback(
    (row: CollectionDocument) => !isChargedTracking(row),
    [],
  );
  const canDeleteBillingRow = useCallback(
    (row: CollectionDocument) =>
      row.paid !== true && String(row.billKind ?? "") !== "globalTransport",
    [],
  );
  const canDeleteRow = useCallback(
    (row: CollectionDocument) => {
      if (isChargedTracking(row)) return false;
      if (isCustomerBillingPage) return canDeleteBillingRow(row);
      return true;
    },
    [isCustomerBillingPage, canDeleteBillingRow],
  );
  const getDeleteDisabledTooltip = useCallback(
    (row: CollectionDocument) => {
      if (isChargedTracking(row)) return CHARGED_TRACKING_DELETE_TOOLTIP;
      if (!isCustomerBillingPage) return undefined;
      if (row.paid === true) return PAID_BILLING_DELETE_TOOLTIP;
      if (String(row.billKind ?? "") === "globalTransport") {
        return GLOBAL_TRANSPORT_BILLING_DELETE_TOOLTIP;
      }
      return undefined;
    },
    [isCustomerBillingPage],
  );
  const rowAction = schema.rowAction ?? "edit";
  const handleAdd = isCustomerBillingPage
    ? () => navigate("/trackings/customer-billing/new")
    : isGlobalChargePage
      ? globalChargeControls.openChargeModal
      : openCreate;
  const openViewBilling = useCallback((row: CollectionDocument) => {
    setViewingBillingRow(row);
  }, []);

  const closeViewBilling = useCallback(() => {
    setViewingBillingRow(null);
  }, []);

  const openViewGlobalCharge = useCallback((row: CollectionDocument) => {
    setViewingGlobalChargeId(row._id);
  }, []);

  const closeViewGlobalCharge = useCallback(() => {
    setViewingGlobalChargeId(null);
  }, []);

  const openViewInvoice = useCallback((row: CollectionDocument) => {
    setViewingInvoiceRow(row);
  }, []);

  const closeViewInvoice = useCallback(() => {
    setViewingInvoiceRow(null);
  }, []);

  const handleRowAction =
    isCustomerBillingPage && schema.rowAction === "view"
      ? openViewBilling
      : isGlobalChargePage && schema.rowAction === "view"
        ? openViewGlobalCharge
        : schema.rowAction === "view"
          ? () => {}
          : openEdit;

  const isFormPending =
    isSavingForm || createMutation.isPending || updateMutation.isPending;
  const isDeletePending =
    deleteMutation.isPending || bulkDeleteMutation.isPending;

  const deleteDialog = useMemo(() => {
    if (!deleteTarget) return null;

    const billingNote = isCustomerBillingPage ? (
      <>
        <br />
        פריטי המעקב יוחזרו לחיוב מחדש.
      </>
    ) : null;

    const globalChargeNote = isGlobalChargePage ? (
      <>
        <br />
        ביטול החיוב ימחק את כל החשבונות שנוצרו ויבטל את החיוב על כל ההובלות
        הקשורות.
      </>
    ) : null;

    if (deleteTarget.type === "single") {
      const name = getDocumentLabel(schema, deleteTarget.row);
      return {
        title: isGlobalChargePage ? "ביטול חיוב גלובלי" : "מחיקת פריט",
        message: (
          <>
            האם למחוק את <strong>{name}</strong> מתוך {schema.label}?
            <br />
            לא ניתן לשחזר.
            {billingNote}
            {globalChargeNote}
          </>
        ),
      };
    }

    const targetRows = deleteTarget.ids
      .map((id) => rows.find((row) => row._id === id))
      .filter((row): row is CollectionDocument => Boolean(row));

    return {
      title: "מחיקת פריטים נבחרים",
      message: (
        <>
          האם למחוק {deleteTarget.ids.length} פריטים מתוך {schema.label}?
          <DeleteDialogList>
            {targetRows.map((row) => (
              <li key={row._id}>{getDocumentLabel(schema, row)}</li>
            ))}
          </DeleteDialogList>
          לא ניתן לשחזר.
          {billingNote}
          {globalChargeNote}
        </>
      ),
    };
  }, [deleteTarget, isCustomerBillingPage, isGlobalChargePage, rows, schema]);

  return (
    <div className="page page-collection">
      <PageHeader>
        <PageHeaderTop>
          <PageTitle>{schema.label}</PageTitle>
          <CollectionToolbar
            schema={schema}
            queryState={tableQuery.state}
            selectedCount={tableQuery.state.selectedIds.length}
            isDeleting={bulkDeleteMutation.isPending}
            addLabel={isGlobalChargePage ? "בצע חיוב גלובלי" : undefined}
            addDisabled={isGlobalChargePage ? globalChargeControls.addDisabled : false}
            onAdd={handleAdd}
            onGlobalSearchChange={tableQuery.setGlobalSearch}
            onSortChange={(field, direction) => {
              if (!field) tableQuery.setSort("", direction);
              else tableQuery.setSort(field, direction);
            }}
            onBulkDelete={() => {
              setDeleteError(null);
              setDeleteTarget({
                type: "bulk",
                ids: tableQuery.state.selectedIds,
              });
            }}
            exportDisabled={isLoading || isError || exporting}
            onExportExcel={handleExportExcel}
          />
        </PageHeaderTop>
        {isTransportTrackingPage && (
          <TransportTrackingPageExtras
            rows={
              Array.isArray(transportAllRows) ? transportAllRows : []
            }
          />
        )}
        {isInvoicesPage && <InvoiceMonthlySummary />}
        {isGlobalChargePage && <TransportGlobalChargePageExtras />}
      </PageHeader>

      <section className="page-body page-body-flush">
        <DataTable
          schema={schema}
          rows={rows}
          queryState={tableQuery.state}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onColumnSearchChange={tableQuery.setColumnSearch}
          onCellChange={handleCellChange}
          onToggleSelect={tableQuery.toggleSelected}
          onToggleSelectAll={tableQuery.toggleSelectAll}
          onEdit={handleRowAction}
          onView={isInvoicesPage ? openViewInvoice : undefined}
          canViewRow={
            isInvoicesPage
              ? (row) => row.hasFile === true
              : undefined
          }
          rowAction={rowAction}
          canEditRow={canEditChargedTrackingRow}
          canDeleteRow={canDeleteRow}
          deleteDisabledTooltip={getDeleteDisabledTooltip}
          onDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget({ type: "single", row });
          }}
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          isFetching={isFetching}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      <CollectionFormModal
        open={modalOpen}
        schema={schema}
        editingRow={editingRow}
        isPending={isFormPending}
        error={formError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        onFileChange={isInvoicesPage ? setPendingInvoiceFile : undefined}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteDialog?.title ?? ""}
        message={deleteDialog?.message ?? ""}
        confirmLabel={isGlobalChargePage ? "בטל חיוב" : "מחק"}
        isPending={isDeletePending}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />

      {isInvoicesPage && (
        <InvoiceViewModal
          open={viewingInvoiceRow !== null}
          invoice={viewingInvoiceRow}
          onClose={closeViewInvoice}
        />
      )}

      {isCustomerBillingPage && (
        <CustomerBillingViewModal
          open={viewingBillingRow !== null}
          billing={viewingBillingRow}
          onClose={closeViewBilling}
        />
      )}

      {isGlobalChargePage && (
        <>
          <GlobalTransportChargeViewModal
            open={viewingGlobalChargeId !== null}
            chargeId={viewingGlobalChargeId}
            onClose={closeViewGlobalCharge}
          />
          {globalChargeControls.chargeModal}
        </>
      )}
    </div>
  );
}

const DeleteDialogList = styled.ul`
  margin: 0.5rem 0;
  padding-inline-start: 1.25rem;
  max-height: 12rem;
  overflow-y: auto;

  li {
    margin: 0.125rem 0;
  }
`;
