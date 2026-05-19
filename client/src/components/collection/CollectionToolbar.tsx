import { useEffect, useRef, useState } from "react";
import type { CollectionSchema } from "../../schema/types";
import type { TableQueryState } from "../../schema/tableQuery";
import "./Collection.css";

type CollectionToolbarProps = {
  schema: CollectionSchema;
  queryState: TableQueryState;
  selectedCount: number;
  isDeleting?: boolean;
  onAdd: () => void;
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  onBulkDelete: () => void;
};

export function CollectionToolbar({
  schema,
  queryState,
  selectedCount,
  isDeleting = false,
  onAdd,
  onSortChange,
  onBulkDelete,
}: CollectionToolbarProps) {
  const sortableColumns = schema.columns.filter((c) => c.sortable !== false);

  const sortAnchorRef = useRef<HTMLDivElement>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [draftField, setDraftField] = useState("");
  const [draftDirection, setDraftDirection] = useState<"asc" | "desc">("asc");

  const activeSort = queryState.sort;
  const activeSortLabel = activeSort
    ? sortableColumns.find((c) => c.key === activeSort.field)?.label
    : null;

  useEffect(() => {
    if (!sortOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        sortAnchorRef.current &&
        !sortAnchorRef.current.contains(event.target as Node)
      ) {
        setSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortOpen]);

  const openSortPopper = () => {
    setDraftField(queryState.sort?.field ?? sortableColumns[0]?.key ?? "");
    setDraftDirection(queryState.sort?.direction ?? "asc");
    setSortOpen((open) => !open);
  };

  const applySort = () => {
    if (draftField) onSortChange(draftField, draftDirection);
    setSortOpen(false);
  };

  const clearSort = () => {
    onSortChange("", "asc");
    setSortOpen(false);
  };

  return (
    <div className="collection-toolbar">
      <button type="button" className="btn btn-add" onClick={onAdd}>
        הוסף
      </button>

      <div className="collection-toolbar-sort" ref={sortAnchorRef}>
        <button
          type="button"
          className={["btn", "btn-sort", activeSort ? "btn-sort-active" : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={openSortPopper}
          aria-expanded={sortOpen}
          aria-haspopup="dialog"
        >
          מיון לפי
          {activeSortLabel ? ` · ${activeSortLabel}` : ""}
        </button>

        {sortOpen && (
          <div
            className="collection-sort-popper"
            role="dialog"
            aria-label="מיון טבלה"
            dir="rtl"
          >
            <label className="collection-sort-label" htmlFor="sort-field">
              מיון לפי
            </label>
            <select
              id="sort-field"
              className="select-control collection-sort-select"
              value={draftField}
              onChange={(e) => setDraftField(e.target.value)}
            >
              <option value="">בחר שדה...</option>
              {sortableColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>

            <label className="collection-sort-label" htmlFor="sort-direction">
              כיוון
            </label>
            <select
              id="sort-direction"
              className="select-control collection-sort-select"
              value={draftDirection}
              onChange={(e) =>
                setDraftDirection(e.target.value as "asc" | "desc")
              }
              disabled={!draftField}
            >
              <option value="asc">עולה</option>
              <option value="desc">יורד</option>
            </select>

            <div className="collection-sort-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={applySort}
                disabled={!draftField}
              >
                מיין
              </button>
              {activeSort && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearSort}
                >
                  נקה מיון
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCount > 0 && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={onBulkDelete}
          disabled={isDeleting}
        >
          מחק נבחרים ({selectedCount})
        </button>
      )}
    </div>
  );
}
