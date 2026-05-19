import { useState, type ChangeEvent } from "react";
import type {
  CollectionSchema,
  CollectionDocument,
  ColumnDef,
  FormSchema,
} from "../../schema/types";
import type { TableQueryState } from "../../schema/tableQuery";
import {
  ENUM_NULL_FILTER,
  ENUM_NULL_LABEL,
  enumAllowsNull,
  formatCell,
  getCellValue,
  getDiscreteColumnOptions,
  isDiscreteColumn,
  parseEnumSelectValue,
} from "../../lib/tableQuery";
import { EditIcon, DeleteIcon } from "./Icons";
import "./Collection.css";

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

function ColumnFilterControl({
  column,
  form,
  value,
  onChange,
}: {
  column: ColumnDef;
  form: FormSchema;
  value: string;
  onChange: (value: string) => void;
}) {
  if (!isDiscreteColumn(column)) {
    return (
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש..."
        aria-label={`חיפוש ב${column.label}`}
      />
    );
  }

  return (
    <select
      className="search-input column-filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`סינון ב${column.label}`}
    >
      <option value="">הכל</option>
      {column.type === "enum" ? (
        <>
          {enumAllowsNull(column, form) && (
            <option value={ENUM_NULL_FILTER}>{ENUM_NULL_LABEL}</option>
          )}
          {(column.enumOptions ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      ) : (
        getDiscreteColumnOptions(column, form).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))
      )}
    </select>
  );
}

function toSelectValue(column: ColumnDef, value: unknown): string {
  if (column.type === "boolean") return String(Boolean(value));
  if (value == null || value === "") return "";
  return String(value);
}

function getBooleanToneClass(
  column: ColumnDef,
  value: unknown,
): string | undefined {
  if (column.type !== "boolean") return undefined;
  return Boolean(value) ? "cell-boolean-true" : "cell-boolean-false";
}

function EditableDiscreteCell({
  column,
  form,
  row,
  onChange,
}: {
  column: ColumnDef;
  form: FormSchema;
  row: CollectionDocument;
  onChange: (value: unknown) => void | Promise<void>;
}) {
  const serverValue = getCellValue(row, column);
  const serverSelectValue = toSelectValue(column, serverValue);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSelectValue, setPendingSelectValue] = useState<string | null>(
    null,
  );
  const options = getDiscreteColumnOptions(column, form);
  const selectValue = pendingSelectValue ?? serverSelectValue;
  const booleanToneClass = getBooleanToneClass(
    column,
    selectValue === "true",
  );

  const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const next =
      column.type === "boolean"
        ? e.target.value === "true"
        : parseEnumSelectValue(column, e.target.value, form);
    const nextSelectValue = toSelectValue(column, next);

    if (nextSelectValue === serverSelectValue) return;

    setPendingSelectValue(nextSelectValue);
    setIsSaving(true);
    try {
      await onChange(next);
    } catch {
      setPendingSelectValue(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <span className="cell-editable-wrap" aria-busy={isSaving}>
      <select
        className={[
          "cell-select",
          "cell-select-inline",
          booleanToneClass,
          isSaving ? "cell-select-saving" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        value={selectValue}
        disabled={isSaving}
        onChange={handleChange}
        aria-label={`עריכת ${column.label}`}
        aria-live="polite"
      >
        {options.map((opt) => (
          <option key={opt.value || ENUM_NULL_FILTER} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isSaving && (
        <span className="cell-saving-indicator" role="status">
          <span className="cell-saving-spinner" aria-hidden="true" />
          <span className="visually-hidden">שומר...</span>
        </span>
      )}
    </span>
  );
}

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
    return <p className="table-loading">טוען...</p>;
  }

  if (isError) {
    return (
      <p className="table-error" role="alert">
        {errorMessage ?? "שגיאה בטעינת הנתונים"}
      </p>
    );
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table" dir="rtl">
        <thead>
          <tr>
            <th className="col-checkbox" scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => onToggleSelectAll(visibleIds)}
                aria-label="בחר הכל"
              />
            </th>
            {schema.columns.map((col) => (
              <th key={col.key} scope="col" style={{ width: col.width }}>
                <div>{col.label}</div>
                {col.searchable !== false && (
                  <ColumnFilterControl
                    column={col}
                    form={schema.form}
                    value={queryState.columnSearch[col.key] ?? ""}
                    onChange={(value) => onColumnSearchChange(col.key, value)}
                  />
                )}
              </th>
            ))}
            <th className="col-actions" scope="col">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={schema.columns.length + 2}>
                <p className="table-empty">אין פריטים להצגה</p>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = queryState.selectedIds.includes(row._id);
              return (
                <tr key={row._id} data-selected={selected || undefined}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(row._id)}
                      aria-label={`בחר ${formatCell(row, schema.columns[0])}`}
                    />
                  </td>
                  {schema.columns.map((col) => {
                    const value = getCellValue(row, col);
                    const canInlineEdit =
                      onCellChange && isDiscreteColumn(col) && !col.render;

                    return (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align ?? "start" }}
                      >
                        {col.render ? (
                          col.render(value, row)
                        ) : canInlineEdit ? (
                          <EditableDiscreteCell
                            column={col}
                            form={schema.form}
                            row={row}
                            onChange={(next) =>
                              onCellChange(row, col.key, next)
                            }
                          />
                        ) : col.type === "boolean" ? (
                          <span
                            className={getBooleanToneClass(col, value)}
                          >
                            {formatCell(row, col)}
                          </span>
                        ) : (
                          formatCell(row, col)
                        )}
                      </td>
                    );
                  })}
                  <td className="col-actions">
                    <div className="col-actions-inner">
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => onEdit(row)}
                        aria-label="עריכה"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => onDelete(row)}
                        aria-label="מחיקה"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
