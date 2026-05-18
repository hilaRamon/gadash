import { useCallback, useMemo, useState } from 'react'
import { getCollectionSchema } from '../schema/registry'
import type { CollectionSchema } from '../schema/types'
import { applyTableQuery } from '../lib/tableQuery'
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
import type { CollectionDocument } from '../schema/types'
import './Page.css'
import '../components/collection/Collection.css'

type CollectionPageProps = {
  collectionId: string
}

type DeleteTarget =
  | { type: 'single'; row: CollectionDocument }
  | { type: 'bulk'; ids: string[] }
  | null

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const schema = getCollectionSchema(collectionId)

  if (!schema) {
    return (
      <div className="page">
        <h1 className="page-title">לא נמצא</h1>
      </div>
    )
  }

  return <CollectionPageContent schema={schema} />
}

function CollectionPageContent({ schema }: { schema: CollectionSchema }) {
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
    () => applyTableQuery(rows, schema, tableQuery.state),
    [rows, schema, tableQuery.state],
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
          await updateMutation.mutateAsync({ id: editingRow.id, body: values })
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

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'single') {
        await deleteMutation.mutateAsync(deleteTarget.row.id)
      } else {
        await bulkDeleteMutation.mutateAsync(deleteTarget.ids)
        tableQuery.resetSelection()
      }
      setDeleteTarget(null)
    } catch {
      // keep dialog open on error
    }
  }, [deleteTarget, deleteMutation, bulkDeleteMutation, tableQuery])

  const isFormPending = createMutation.isPending || updateMutation.isPending
  const isDeletePending = deleteMutation.isPending || bulkDeleteMutation.isPending

  return (
    <div className="page page-collection">
      <header className="page-header">
        <h1 className="page-title">{schema.label}</h1>
      </header>

      <section className="page-body page-body-flush">
        <CollectionToolbar
          schema={schema}
          queryState={tableQuery.state}
          selectedCount={tableQuery.state.selectedIds.length}
          isDeleting={bulkDeleteMutation.isPending}
          onAdd={openCreate}
          onSortChange={(field, direction) => {
            if (!field) tableQuery.setSort('', direction)
            else tableQuery.setSort(field, direction)
          }}
          onFilterChange={tableQuery.setFilter}
          onBulkDelete={() =>
            setDeleteTarget({
              type: 'bulk',
              ids: tableQuery.state.selectedIds,
            })
          }
        />

        <DataTable
          schema={schema}
          rows={visibleRows}
          queryState={tableQuery.state}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onColumnSearchChange={tableQuery.setColumnSearch}
          onToggleSelect={tableQuery.toggleSelected}
          onToggleSelectAll={tableQuery.toggleSelectAll}
          onEdit={openEdit}
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
        title={
          deleteTarget?.type === 'bulk'
            ? 'מחיקת פריטים נבחרים'
            : 'מחיקת פריט'
        }
        message={
          deleteTarget?.type === 'bulk'
            ? `האם למחוק ${deleteTarget.ids.length} פריטים?`
            : 'האם למחוק פריט זה? לא ניתן לשחזר.'
        }
        confirmLabel="מחק"
        isPending={isDeletePending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
