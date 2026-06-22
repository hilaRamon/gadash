import type { CollectionDocument } from "../../../schema/types";
import type { MaterialUsageLineEntry } from "./materialUsageTrackingForm";
import { TrackingMultiCreateFields } from "./TrackingMultiCreateFields";

type MaterialUsageMultiCreateFieldsProps = {
  materials: CollectionDocument[];
  entries: MaterialUsageLineEntry[];
  fieldErrors: Record<string, string>;
  plotId: string;
  onToggleMaterial: (materialId: string, checked: boolean) => void;
  onUpdateLine: (
    materialId: string,
    patch: Partial<Pick<MaterialUsageLineEntry, "materialId" | "amount">>,
  ) => void;
};

function getMaterialName(
  materials: CollectionDocument[],
  materialId: string,
): string {
  const material = materials.find((row) => String(row._id) === materialId);
  return typeof material?.name === "string" ? material.name : materialId;
}

export function MaterialUsageMultiCreateFields({
  materials,
  entries,
  fieldErrors,
  plotId,
  onToggleMaterial,
  onUpdateLine,
}: MaterialUsageMultiCreateFieldsProps) {
  return (
    <TrackingMultiCreateFields
      sectionLabel="חומרים *"
      selectionErrorKey="materials"
      referenceCollection="materials"
      referenceFieldLabel="חומר"
      amountLabel="כמות"
      items={materials}
      entries={entries.map((entry) => ({
        itemId: entry.materialId,
        amount: entry.amount,
      }))}
      fieldErrors={fieldErrors}
      amountDisabled={!plotId}
      getItemLabel={(itemId) => getMaterialName(materials, itemId)}
      onToggleItem={onToggleMaterial}
      onUpdateLine={(itemId, patch) =>
        onUpdateLine(itemId, {
          materialId: patch.itemId,
          amount: patch.amount,
        })
      }
    />
  );
}
