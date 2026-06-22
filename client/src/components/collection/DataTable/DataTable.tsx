import styled, { css } from "styled-components";
import { PAID_BILLING_DELETE_TOOLTIP } from "../../../lib/customerBillingErrors";
import { CHARGED_TRACKING_EDIT_TOOLTIP } from "../../../lib/chargedTrackingErrors";
import type {
  CollectionSchema,
  CollectionDocument,
} from "../../../schema/types";
import type { TableQueryState } from "../../../schema/tableQuery";
import { formatCell, getCellValue } from "../../../lib/tableQuery";
import { EditIcon, ViewIcon, DeleteIcon } from "../Icons";
import { buttonIconStyles } from "./sharedStyles";
import { ColumnFilterControl } from "./ColumnFilterControl";
import { EditableBooleanCell } from "./EditableBooleanCell";
import { EditableDiscreteCell } from "./EditableDiscreteCell";
import { ReadOnlyBooleanCell } from "./ReadOnlyBooleanCell";
import { EditableNumberCell } from "./EditableNumberCell";
import { EditableTextCell } from "./EditableTextCell";
import { ActionTooltip } from "./ActionTooltip";

const TableWrap = styled.div<{ $previewMode?: boolean }>`
  max-width: 100%;
  overflow-x: ${({ $previewMode }) => ($previewMode ? "hidden" : "auto")};
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const Table = styled.table<{ $previewMode?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: ${({ $previewMode }) => ($previewMode ? "fixed" : "auto")};

  th,
  td {
    padding: 0.55rem 0.6rem;
    border-bottom: 1px solid var(--border-color);
    text-align: start;
    vertical-align: middle;

    ${({ $previewMode }) =>
      $previewMode &&
      css`
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `}
  }

  thead th {
    background: var(--hover-bg);
    font-weight: 600;
    color: var(--text-secondary);
    border: none;
  }

  tbody tr:hover {
    background: var(--hover-bg);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const TableBodyCell = styled.td<{
  $editableNumber?: boolean;
  $editableText?: boolean;
}>`
  ${({ $editableNumber, $editableText }) =>
    ($editableNumber || $editableText) &&
    css`
      vertical-align: middle;
      padding-top: 0.45rem;
      padding-bottom: 0.45rem;
      overflow: hidden;
      text-overflow: clip;
    `}
`;

const HeaderLabelCell = styled.th`
  vertical-align: bottom;
  line-height: 1.25;
  border: none;
`;

const HeaderFilterCell = styled.th`
  vertical-align: top;
  font-weight: 400;
  padding-top: 0;
  border-top: none;
`;

const CheckboxCol = styled.th`
  width: 2.5rem;
  text-align: center;

  && {
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
  }
`;

const CheckboxCell = styled.td`
  width: 2.5rem;
  text-align: center;

  && {
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
  }
`;

const ActionsCol = styled.th`
  width: 5.5rem;
  white-space: nowrap;
`;

const ActionsCell = styled.td`
  width: 5.5rem;
  white-space: nowrap;
`;

const ActionsInner = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
`;

const IconButton = styled.button`
  ${buttonIconStyles};
`;

const TableStatus = styled.p<{ $error?: boolean }>`
  padding: 2rem;
  text-align: center;
  color: ${({ $error }) => ($error ? "#fc8181" : "var(--text-secondary)")};
`;

const EmptyMessage = styled.p`
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
`;

export type DataTableProps = {
  schema: CollectionSchema;
  rows: CollectionDocument[];
  queryState: TableQueryState;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onColumnSearchChange: (key: string, value: string) => void;
  onCellChange?: (
    row: CollectionDocument,
    key: string,
    value: unknown,
  ) => void | Promise<void>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (visibleIds: string[]) => void;
  onEdit: (row: CollectionDocument) => void;
  onDelete: (row: CollectionDocument) => void;
  canDeleteRow?: (row: CollectionDocument) => boolean;
  canEditRow?: (row: CollectionDocument) => boolean;
  rowAction?: "edit" | "view";
  /** Hides row actions and column filter row. */
  previewMode?: boolean;
  /** Include-in-bill checkboxes (used with previewMode). */
  previewIncludeSelection?: {
    isIncluded: (id: string) => boolean;
    onToggleInclude: (id: string) => void;
    onToggleIncludeAll: (ids: string[]) => void;
  };
};

export function DataTable({
  schema,
  rows,
  queryState,
  isLoading = false,
  isError = false,
  errorMessage,
  onColumnSearchChange,
  onCellChange,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  canDeleteRow,
  canEditRow,
  rowAction = "edit",
  previewMode = false,
  previewIncludeSelection,
}: DataTableProps) {
  const visibleIds = rows.map((r) => r._id);
  const showIncludeColumn = previewMode && previewIncludeSelection != null;
  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => queryState.selectedIds.includes(id));
  const someSelected = visibleIds.some((id) =>
    queryState.selectedIds.includes(id),
  );
  const allIncluded =
    showIncludeColumn &&
    visibleIds.length > 0 &&
    visibleIds.every((id) => previewIncludeSelection.isIncluded(id));
  const someIncluded =
    showIncludeColumn &&
    visibleIds.some((id) => previewIncludeSelection.isIncluded(id));

  if (isLoading) {
    return <TableStatus>טוען...</TableStatus>;
  }

  if (isError) {
    return (
      <TableStatus $error role="alert">
        {errorMessage ?? "שגיאה בטעינת הנתונים"}
      </TableStatus>
    );
  }

  return (
    <TableWrap $previewMode={previewMode}>
      <Table dir="rtl" $previewMode={previewMode}>
        <thead>
          <tr>
            {showIncludeColumn && (
              <CheckboxCol scope="col">
                <input
                  type="checkbox"
                  checked={allIncluded}
                  ref={(el) => {
                    if (el) el.indeterminate = someIncluded && !allIncluded;
                  }}
                  onChange={() =>
                    previewIncludeSelection.onToggleIncludeAll(visibleIds)
                  }
                  aria-label="לכלול הכל בחיוב"
                />
              </CheckboxCol>
            )}
            {!previewMode && (
              <CheckboxCol scope="col" rowSpan={2}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => onToggleSelectAll(visibleIds)}
                  aria-label="בחר הכל"
                />
              </CheckboxCol>
            )}
            {schema.columns.map((col) => (
              <HeaderLabelCell
                key={col.key}
                scope="col"
                style={{ width: col.width }}
              >
                {col.label}
              </HeaderLabelCell>
            ))}
            {!previewMode && <ActionsCol scope="col" rowSpan={2} />}
          </tr>
          {!previewMode && (
            <tr>
              {schema.columns.map((col) => (
                <HeaderFilterCell
                  key={`${col.key}-filter`}
                  scope="col"
                  style={{ width: col.width }}
                >
                  {col.searchable !== false ? (
                    <ColumnFilterControl
                      column={col}
                      form={schema.form}
                      value={queryState.columnSearch[col.key] ?? ""}
                      onChange={(value) => onColumnSearchChange(col.key, value)}
                    />
                  ) : null}
                </HeaderFilterCell>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={
                  schema.columns.length +
                  (showIncludeColumn ? 1 : 0) +
                  (previewMode ? 0 : 2)
                }
              >
                <EmptyMessage>אין פריטים להצגה</EmptyMessage>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = queryState.selectedIds.includes(row._id);
              const rowEditable = canEditRow == null || canEditRow(row);
              return (
                <tr key={row._id} data-selected={selected || undefined}>
                  {showIncludeColumn && (
                    <CheckboxCell>
                      <input
                        type="checkbox"
                        checked={previewIncludeSelection.isIncluded(row._id)}
                        onChange={() =>
                          previewIncludeSelection.onToggleInclude(row._id)
                        }
                        aria-label={`לכלול בחיוב ${formatCell(row, schema.columns[0])}`}
                      />
                    </CheckboxCell>
                  )}
                  {!previewMode && (
                    <CheckboxCell>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(row._id)}
                        aria-label={`בחר ${formatCell(row, schema.columns[0])}`}
                      />
                    </CheckboxCell>
                  )}
                  {schema.columns.map((col) => {
                    const value = getCellValue(row, col);
                    const canEditBoolean =
                      rowEditable &&
                      onCellChange &&
                      col.type === "boolean" &&
                      !col.render &&
                      (col.inlineEditable?.(row) ?? true);
                    const canEditEnum =
                      rowEditable &&
                      onCellChange &&
                      col.type === "enum" &&
                      !col.render &&
                      (col.enumOptions?.length ?? 0) > 0 &&
                      (col.inlineEditable?.(row) ?? true);
                    const canEditNumber =
                      rowEditable &&
                      onCellChange &&
                      col.type === "number" &&
                      !col.render &&
                      col.inlineEditable?.(row) === true;
                    const canEditText =
                      rowEditable &&
                      onCellChange &&
                      col.type === "text" &&
                      !col.render &&
                      col.inlineEditable?.(row) === true;

                    return (
                      <TableBodyCell
                        key={col.key}
                        $editableNumber={canEditNumber}
                        $editableText={canEditText}
                        style={{
                          textAlign: previewMode
                            ? "right"
                            : col.align ??
                              (col.type === "boolean" ? "center" : "start"),
                        }}
                      >
                        {col.render ? (
                          col.render(value, row)
                        ) : canEditBoolean ? (
                          <EditableBooleanCell
                            column={col}
                            row={row}
                            onChange={(next) =>
                              onCellChange(row, col.key, next)
                            }
                          />
                        ) : canEditEnum ? (
                          <EditableDiscreteCell
                            column={col}
                            form={schema.form}
                            row={row}
                            onChange={(next) =>
                              onCellChange(row, col.key, next)
                            }
                          />
                        ) : canEditNumber ? (
                          <EditableNumberCell
                            column={col}
                            row={row}
                            previewMode={previewMode}
                            onChange={(next) =>
                              onCellChange(row, col.key, next)
                            }
                          />
                        ) : canEditText ? (
                          <EditableTextCell
                            column={col}
                            row={row}
                            onChange={(next) =>
                              onCellChange(row, col.key, next)
                            }
                          />
                        ) : col.type === "boolean" ? (
                          <ReadOnlyBooleanCell
                            column={col}
                            checked={Boolean(value)}
                            row={row}
                          />
                        ) : (
                          formatCell(row, col)
                        )}
                      </TableBodyCell>
                    );
                  })}
                  {!previewMode && (
                    <ActionsCell>
                      <ActionsInner>
                        <ActionTooltip
                          text={
                            canEditRow != null && !canEditRow(row)
                              ? CHARGED_TRACKING_EDIT_TOOLTIP
                              : undefined
                          }
                        >
                          <IconButton
                            type="button"
                            onClick={() => onEdit(row)}
                            disabled={canEditRow != null && !canEditRow(row)}
                            aria-label={rowAction === "view" ? "צפייה" : "עריכה"}
                            aria-disabled={
                              canEditRow != null && !canEditRow(row)
                            }
                          >
                            {rowAction === "view" ? <ViewIcon /> : <EditIcon />}
                          </IconButton>
                        </ActionTooltip>
                        <ActionTooltip
                          text={
                            canDeleteRow != null && !canDeleteRow(row)
                              ? PAID_BILLING_DELETE_TOOLTIP
                              : undefined
                          }
                        >
                          <IconButton
                            type="button"
                            onClick={() => onDelete(row)}
                            disabled={
                              canDeleteRow != null && !canDeleteRow(row)
                            }
                            aria-label="מחיקה"
                            aria-disabled={
                              canDeleteRow != null && !canDeleteRow(row)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ActionTooltip>
                      </ActionsInner>
                    </ActionsCell>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
