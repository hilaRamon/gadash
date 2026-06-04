import { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { getCollectionSchema } from '../schema/registry'
import type { CollectionSchema } from '../schema/types'
import { applyTableQuery } from '../lib/tableQuery'
import { getDocumentLabel } from '../lib/documentLabel'
import { exportCollectionToExcel } from '../lib/exportCollectionExcel'
import { useTableQueryState } from '../hooks/useTableQueryState'
import { useCollectionList } from '../hooks/collections/useCollectionList'
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDeleteDocuments,
} from '../hooks/collections/useCollectionMutations'
import { CollectionToolbar } from '../components/collection/CollectionToolbar'
import { DataTable } from '../components/collection/DataTable'
import { CollectionFormModal } from '../components/collection/CollectionFormModal'
import { ConfirmDialog } from '../components/collection/ConfirmDialog'
import { TransportTrackingPageExtras } from '../components/transport/TransportTrackingPageExtras'
import type { CollectionDocument } from '../schema/types'
import './Page.css'

type CollectionPageProps = {
  collectionId: string
}

type DeleteTarget =
  | { type: 'single'; row: CollectionDocument }
  | { type: 'bulk'; ids: string[] }
  | null

function matchesOperationTrackingPageFilter(
  collectionId: string,
  row: CollectionDocument,
): boolean {
  if (!collectionId.startsWith('operations-trackings-')) return true
  const operationType = String(row.operationType ?? '')
  if (collectionId === 'operations-trackings-field-work') {
    return operationType === 'עיבוד'
  }
  if (collectionId === 'operations-trackings-admin') {
    return operationType === 'מנהלה'
  }
  if (collectionId === 'operations-trackings-all') {
    return operationType !== 'דלק'
  }
  return true
}

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const schema = getCollectionSchema(collectionId)

  if (!schema) {
    return (
      <div className="page">
        <h1 className="page-title">לא נמצא</h1>
      </div>
    )
  }

  return (
    <CollectionPageContent
      key={schema.id}
      schema={schema}
      collectionId={collectionId}
    />
  )
}

function CollectionPageContent({
  schema,
  collectionId,
}: {
  schema: CollectionSchema
  collectionId: string
}) {
  const tableQuery = useTableQueryState(schema)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<CollectionDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: rows = [], isLoading, isError, error } = useCollectionList(
    schema.collection,
  )

  const createMutation = useCreateDocument(schema.collection)
  const updateMutation = useUpdateDocument(schema.collection)
  const deleteMutation = useDeleteDocument(schema.collection)
  const bulkDeleteMutation = useBulkDeleteDocuments(schema.collection)

  const visibleRows = useMemo(
    () =>
      applyTableQuery(
        rows.filter((row) => matchesOperationTrackingPageFilter(collectionId, row)),
        schema,
        tableQuery.state,
      ),
    [rows, schema, tableQuery.state, collectionId],
  )

  const openCreate = useCallback(() => {
    setEditingRow(null)
    setFormError(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: CollectionDocument) => {
    setEditingRow(row)
    setFormError(null)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingRow(null)
    setFormError(null)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      setFormError(null)
      try {
        if (editingRow) {
          await updateMutation.mutateAsync({ id: editingRow._id, body: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        closeModal()
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'שגיאה בשמירה')
      }
    },
    [editingRow, updateMutation, createMutation, closeModal],
  )

  const handleCellChange = useCallback(
    async (row: CollectionDocument, key: string, value: unknown) => {
      await updateMutation.mutateAsync({
        id: row._id,
        body: { [key]: value },
      })
    },
    [updateMutation],
  )

  const handleExportExcel = useCallback(() => {
    exportCollectionToExcel(schema, visibleRows)
  }, [schema, visibleRows])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'single') {
        await deleteMutation.mutateAsync(deleteTarget.row._id)
      } else {
        await bulkDeleteMutation.mutateAsync(deleteTarget.ids)
        tableQuery.resetSelection()
      }
      setDeleteTarget(null)
    } catch {
      // keep dialog open on error
    }
  }, [deleteTarget, deleteMutation, bulkDeleteMutation, tableQuery])

  const isTransportTrackingPage = collectionId === 'transport-trackings'
  const rowAction = schema.rowAction ?? 'edit'
  const handleAdd = schema.disableAdd ? () => {} : openCreate
  const handleRowAction = schema.rowAction === 'view' ? () => {} : openEdit
  const isFormPending = createMutation.isPending || updateMutation.isPending
  const isDeletePending = deleteMutation.isPending || bulkDeleteMutation.isPending

  const deleteDialog = useMemo(() => {
    if (!deleteTarget) return null

    if (deleteTarget.type === 'single') {
      const name = getDocumentLabel(schema, deleteTarget.row)
      return {
        title: 'מחיקת פריט',
        message: (
          <>
            האם למחוק את <strong>{name}</strong> מתוך {schema.label}?
            <br />
            לא ניתן לשחזר.
          </>
        ),
      }
    }

    const targetRows = deleteTarget.ids
      .map((id) => rows.find((row) => row._id === id))
      .filter((row): row is CollectionDocument => Boolean(row))

    return {
      title: 'מחיקת פריטים נבחרים',
      message: (
        <>
          האם למחוק {deleteTarget.ids.length} פריטים מתוך {schema.label}?
          <DeleteDialogList>
            {targetRows.map((row) => (
              <li key={row._id}>{getDocumentLabel(schema, row)}</li>
            ))}
          </DeleteDialogList>
          לא ניתן לשחזר.
        </>
      ),
    }
  }, [deleteTarget, rows, schema])

  return (
    <div className="page page-collection">
      <PageHeader $stacked={isTransportTrackingPage}>
        <PageHeaderTop>
          <PageTitle>{schema.label}</PageTitle>
          <CollectionToolbar
          schema={schema}
          queryState={tableQuery.state}
          selectedCount={tableQuery.state.selectedIds.length}
          isDeleting={bulkDeleteMutation.isPending}
          onAdd={handleAdd}
          onGlobalSearchChange={tableQuery.setGlobalSearch}
          onSortChange={(field, direction) => {
            if (!field) tableQuery.setSort('', direction)
            else tableQuery.setSort(field, direction)
          }}
          onBulkDelete={() =>
            setDeleteTarget({
              type: 'bulk',
              ids: tableQuery.state.selectedIds,
            })
          }
          exportDisabled={isLoading || isError}
          onExportExcel={handleExportExcel}
          />
        </PageHeaderTop>
        {isTransportTrackingPage && (
          <TransportTrackingPageExtras rows={rows} />
        )}
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
          onDelete={(row) => setDeleteTarget({ type: 'single', row })}
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
        title={deleteDialog?.title ?? ''}
        message={deleteDialog?.message ?? ''}
        confirmLabel="מחק"
        isPending={isDeletePending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

const PageHeader = styled.header<{ $stacked?: boolean }>`
  display: flex;
  flex-direction: ${({ $stacked }) => ($stacked ? 'column' : 'row')};
  flex-wrap: wrap;
  align-items: ${({ $stacked }) => ($stacked ? 'stretch' : 'center')};
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`

const PageHeaderTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
`

const PageTitle = styled.h1`
  margin: 0;
  flex-shrink: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
`

const DeleteDialogList = styled.ul`
  margin: 0.5rem 0;
  padding-inline-start: 1.25rem;
  max-height: 12rem;
  overflow-y: auto;

  li {
    margin: 0.125rem 0;
  }
`
