import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getCollectionSchema } from "../schema/registry";
import type { CollectionSchema } from "../schema/types";
import { applyTableQuery } from "../lib/tableQuery";
import { getDocumentLabel } from "../lib/documentLabel";
import { exportCollectionToExcel } from "../lib/exportCollectionExcel";
import { useTableQueryState } from "../hooks/useTableQueryState";
import { useCollectionList } from "../hooks/collections/useCollectionList";
import { useSeason } from "../context/SeasonContext";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDeleteDocuments,
} from "../hooks/collections/useCollectionMutations";
import { CollectionToolbar } from "../components/collection/CollectionToolbar";
import {
  PageHeader,
  PageHeaderTop,
  PageTitle,
} from "../components/page/PageHeaderLayout";
import { DataTable } from "../components/collection/DataTable";
import { CollectionFormModal } from "../components/collection/CollectionFormModal";
import { ConfirmDialog } from "../components/collection/ConfirmDialog";
import { TransportTrackingPageExtras } from "../components/transport/TransportTrackingPageExtras";
import { TransportGlobalChargePageExtras } from "../components/transport/TransportGlobalChargePageExtras";
import { GlobalTransportChargeViewModal } from "../components/transport/GlobalTransportChargeViewModal";
import { CustomerBillingViewModal } from "../components/customerBilling/CustomerBillingViewModal";
import { useGlobalChargeModalControls } from "../hooks/transport/useGlobalChargeModalControls";
import {
  GLOBAL_TRANSPORT_BILLING_DELETE_TOOLTIP,
  PAID_BILLING_DELETE_TOOLTIP,
} from "../lib/customerBillingErrors";
import { isChargedTracking } from "../lib/chargedTracking";
import { CHARGED_TRACKING_EDIT_ERROR } from "../lib/chargedTrackingErrors";
import type { CollectionDocument } from "../schema/types";
import "./Page.css";

type CollectionPageProps = {
  collectionId: string;
};

type DeleteTarget =
  | { type: "single"; row: CollectionDocument }
  | { type: "bulk"; ids: string[] }
  | null;

function getMutationErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } })
      .response;
    if (response?.data?.error) return response.data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function matchesOperationTrackingPageFilter(
  collectionId: string,
  row: CollectionDocument,
): boolean {
  if (!collectionId.startsWith("operations-trackings-")) return true;
  const operationType = String(row.operationType ?? "");
  if (collectionId === "operations-trackings-field-work") {
    return operationType === "עיבוד";
  }
  if (collectionId === "operations-trackings-admin") {
    return operationType === "מנהלה";
  }
  if (collectionId === "operations-trackings-all") {
    return operationType !== "דלק";
  }
  return true;
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
  const { selectedSeasonYear } = useSeason();
  const tableQuery = useTableQueryState(schema);

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

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useCollectionList(schema.collection, { season: selectedSeasonYear });

  const createMutation = useCreateDocument(schema.collection);
  const updateMutation = useUpdateDocument(schema.collection);
  const deleteMutation = useDeleteDocument(schema.collection);
  const bulkDeleteMutation = useBulkDeleteDocuments(schema.collection);

  const visibleRows = useMemo(
    () =>
      applyTableQuery(
        rows.filter((row) =>
          matchesOperationTrackingPageFilter(collectionId, row),
        ),
        schema,
        tableQuery.state,
      ),
    [rows, schema, tableQuery.state, collectionId],
  );

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
  }, []);

  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown> | Record<string, unknown>[]) => {
      setFormError(null);
      if (editingRow && isChargedTracking(editingRow)) {
        setFormError(CHARGED_TRACKING_EDIT_ERROR);
        return;
      }
      try {
        if (editingRow) {
          await updateMutation.mutateAsync({
            id: editingRow._id,
            body: values as Record<string, unknown>,
          });
        } else if (Array.isArray(values)) {
          for (const payload of values) {
            await createMutation.mutateAsync(payload);
          }
        } else {
          await createMutation.mutateAsync(values);
        }
        closeModal();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "שגיאה בשמירה");
      }
    },
    [editingRow, updateMutation, createMutation, closeModal],
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

  const handleExportExcel = useCallback(() => {
    exportCollectionToExcel(schema, visibleRows);
  }, [schema, visibleRows]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
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
  }, [deleteTarget, deleteMutation, bulkDeleteMutation, tableQuery]);

  const isTransportTrackingPage = collectionId === "transport-trackings";
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
  const getBillingDeleteTooltip = useCallback((row: CollectionDocument) => {
    if (row.paid === true) return PAID_BILLING_DELETE_TOOLTIP;
    if (String(row.billKind ?? "") === "globalTransport") {
      return GLOBAL_TRANSPORT_BILLING_DELETE_TOOLTIP;
    }
    return undefined;
  }, []);
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

  const handleRowAction =
    isCustomerBillingPage && schema.rowAction === "view"
      ? openViewBilling
      : isGlobalChargePage && schema.rowAction === "view"
        ? openViewGlobalCharge
        : schema.rowAction === "view"
          ? () => {}
          : openEdit;
  const isFormPending = createMutation.isPending || updateMutation.isPending;
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
            exportDisabled={isLoading || isError}
            onExportExcel={handleExportExcel}
          />
        </PageHeaderTop>
        {isTransportTrackingPage && <TransportTrackingPageExtras rows={rows} />}
        {isGlobalChargePage && <TransportGlobalChargePageExtras />}
      </PageHeader>

      <section className="page-body page-body-flush">
        <DataTable
          schema={schema}
          rows={visibleRows}
          queryState={tableQuery.state}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onColumnSearchChange={tableQuery.setColumnSearch}
          onCellChange={handleCellChange}
          onToggleSelect={tableQuery.toggleSelected}
          onToggleSelectAll={tableQuery.toggleSelectAll}
          onEdit={handleRowAction}
          rowAction={rowAction}
          canEditRow={canEditChargedTrackingRow}
          canDeleteRow={isCustomerBillingPage ? canDeleteBillingRow : undefined}
          deleteDisabledTooltip={
            isCustomerBillingPage ? getBillingDeleteTooltip : undefined
          }
          onDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget({ type: "single", row });
          }}
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
