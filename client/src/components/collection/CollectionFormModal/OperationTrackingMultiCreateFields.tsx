import type { CollectionDocument } from "../../../schema/types";
import type { OperationTrackingLineEntry } from "./operationTrackingForm";
import { TrackingMultiCreateFields } from "./TrackingMultiCreateFields";

type OperationTrackingMultiCreateFieldsProps = {
  operations: CollectionDocument[];
  entries: OperationTrackingLineEntry[];
  fieldErrors: Record<string, string>;
  operationFilter?: (row: CollectionDocument) => boolean;
  onToggleOperation: (operationId: string, checked: boolean) => void;
  onUpdateLine: (
    operationId: string,
    patch: Partial<Pick<OperationTrackingLineEntry, "operationId" | "amount">>,
  ) => void;
};

function getOperationName(
  operations: CollectionDocument[],
  operationId: string,
): string {
  const operation = operations.find((row) => String(row._id) === operationId);
  return typeof operation?.name === "string" ? operation.name : operationId;
}

export function OperationTrackingMultiCreateFields({
  operations,
  entries,
  fieldErrors,
  operationFilter,
  onToggleOperation,
  onUpdateLine,
}: OperationTrackingMultiCreateFieldsProps) {
  const visibleOperations = operationFilter
    ? operations.filter(operationFilter)
    : operations;

  return (
    <TrackingMultiCreateFields
      sectionLabel="פעולות *"
      selectionErrorKey="operations"
      referenceCollection="operations"
      referenceFieldLabel="פעולה"
      amountLabel="כמות"
      items={visibleOperations}
      entries={entries.map((entry) => ({
        itemId: entry.operationId,
        amount: entry.amount,
      }))}
      fieldErrors={fieldErrors}
      referenceFilter={operationFilter}
      getItemLabel={(itemId) => getOperationName(operations, itemId)}
      onToggleItem={onToggleOperation}
      onUpdateLine={(itemId, patch) =>
        onUpdateLine(itemId, {
          operationId: patch.itemId,
          amount: patch.amount,
        })
      }
    />
  );
}
