import styled from "styled-components";
import type {
  CollectionSchema,
  CollectionDocument,
} from "../../../schema/types";
import type { TableQueryState } from "../../../schema/tableQuery";
import { formatCell, getCellValue } from "../../../lib/tableQuery";
import { EditIcon, DeleteIcon } from "../Icons";
import { buttonIconStyles } from "./sharedStyles";
import { ColumnFilterControl } from "./ColumnFilterControl";
import { EditableBooleanCell } from "./EditableBooleanCell";
import { EditableDiscreteCell } from "./EditableDiscreteCell";
import { ReadOnlyBooleanCell } from "./ReadOnlyBooleanCell";

const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th,
  td {
    padding: 0.55rem 0.6rem;
    border-bottom: 1px solid var(--border-color);
    text-align: start;
    vertical-align: middle;
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
`;

const CheckboxCell = styled.td`
  width: 2.5rem;
  text-align: center;
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

type DataTableProps = {
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
}: DataTableProps) {
  const visibleIds = rows.map((r) => r._id);
  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => queryState.selectedIds.includes(id));
  const someSelected = visibleIds.some((id) =>
    queryState.selectedIds.includes(id),
  );

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
    <TableWrap>
      <Table dir="rtl">
        <thead>
          <tr>
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
            {schema.columns.map((col) => (
              <HeaderLabelCell
                key={col.key}
                scope="col"
                style={{ width: col.width }}
              >
                {col.label}
              </HeaderLabelCell>
            ))}
            <ActionsCol scope="col" rowSpan={2} />
          </tr>
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
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={schema.columns.length + 2}>
                <EmptyMessage>אין פריטים להצגה</EmptyMessage>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = queryState.selectedIds.includes(row._id);
              return (
                <tr key={row._id} data-selected={selected || undefined}>
                  <CheckboxCell>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(row._id)}
                      aria-label={`בחר ${formatCell(row, schema.columns[0])}`}
                    />
                  </CheckboxCell>
                  {schema.columns.map((col) => {
                    const value = getCellValue(row, col);
                    const canEditBoolean =
                      onCellChange &&
                      col.type === "boolean" &&
                      !col.render &&
                      (col.inlineEditable?.(row) ?? true);
                    const canEditEnum =
                      onCellChange &&
                      col.type === "enum" &&
                      !col.render &&
                      (col.enumOptions?.length ?? 0) > 0;

                    return (
                      <td
                        key={col.key}
                        style={{
                          textAlign:
                            col.align ??
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
                        ) : col.type === "boolean" ? (
                          <ReadOnlyBooleanCell
                            column={col}
                            checked={Boolean(value)}
                            row={row}
                          />
                        ) : (
                          formatCell(row, col)
                        )}
                      </td>
                    );
                  })}
                  <ActionsCell>
                    <ActionsInner>
                      <IconButton
                        type="button"
                        onClick={() => onEdit(row)}
                        aria-label="עריכה"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        type="button"
                        onClick={() => onDelete(row)}
                        aria-label="מחיקה"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ActionsInner>
                  </ActionsCell>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
