import styled from "styled-components";
import type { CollectionSchema } from "../../../schema/types";
import type { TableQueryState } from "../../../schema/tableQuery";
import { AddButton } from "./AddButton";
import { SortControl } from "./SortControl";
import { ExportButton } from "./ExportButton";
import { GlobalSearch } from "./GlobalSearch";
import { BulkDeleteButton } from "./BulkDeleteButton";

/* =========================================================================
 * CollectionToolbar
 * Header toolbar for a collection page. Composes the add / sort / export /
 * search / bulk-delete controls. Equivalent of `.collection-toolbar`.
 * ========================================================================= */

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  direction: ltr;
  justify-content: flex-start;
`;

type CollectionToolbarProps = {
  schema: CollectionSchema;
  queryState: TableQueryState;
  selectedCount: number;
  isDeleting?: boolean;
  exportDisabled?: boolean;
  onAdd: () => void;
  onGlobalSearchChange: (value: string) => void;
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  onBulkDelete: () => void;
  onExportExcel: () => void;
};

export function CollectionToolbar({
  schema,
  queryState,
  selectedCount,
  isDeleting = false,
  exportDisabled = false,
  onAdd,
  onGlobalSearchChange,
  onSortChange,
  onBulkDelete,
  onExportExcel,
}: CollectionToolbarProps) {
  return (
    <Toolbar>
      {/* Add new document */}
      <AddButton onClick={onAdd} />

      {/* Bulk delete of selected rows */}
      <BulkDeleteButton
        selectedCount={selectedCount}
        isDeleting={isDeleting}
        onClick={onBulkDelete}
      />

      {/* Sort field / direction picker */}
      <SortControl
        schema={schema}
        queryState={queryState}
        onSortChange={onSortChange}
      />

      {/* Export visible rows to Excel */}
      <ExportButton disabled={exportDisabled} onClick={onExportExcel} />

      {/* Global free-text search */}
      <GlobalSearch
        value={queryState.globalSearch ?? ""}
        onChange={onGlobalSearchChange}
      />
    </Toolbar>
  );
}
