import type { CollectionDocument } from "@/schema/types";
import type { PlotTrackingLineEntry } from "./operationTrackingForm";
import { TrackingMultiCreateFields } from "./TrackingMultiCreateFields";

type PlotMultiCreateFieldsProps = {
  plots: CollectionDocument[];
  entries: PlotTrackingLineEntry[];
  fieldErrors: Record<string, string>;
  amountLabel?: string;
  onTogglePlot: (plotId: string, checked: boolean) => void;
  onUpdateLine: (
    plotId: string,
    patch: Partial<Pick<PlotTrackingLineEntry, "plotId" | "amount">>,
  ) => void;
};

function getPlotName(plots: CollectionDocument[], plotId: string): string {
  const plot = plots.find((row) => String(row._id) === plotId);
  return typeof plot?.name === "string" ? plot.name : plotId;
}

export function PlotMultiCreateFields({
  plots,
  entries,
  fieldErrors,
  amountLabel = "דונם",
  onTogglePlot,
  onUpdateLine,
}: PlotMultiCreateFieldsProps) {
  return (
    <TrackingMultiCreateFields
      sectionLabel="חלקות *"
      selectionErrorKey="plots"
      referenceCollection="plots"
      referenceFieldLabel="חלקה"
      amountLabel={amountLabel}
      items={plots}
      entries={entries.map((entry) => ({
        itemId: entry.plotId,
        amount: entry.amount,
      }))}
      fieldErrors={fieldErrors}
      getItemLabel={(itemId) => getPlotName(plots, itemId)}
      onToggleItem={onTogglePlot}
      onUpdateLine={(itemId, patch) =>
        onUpdateLine(itemId, {
          plotId: patch.itemId,
          amount: patch.amount,
        })
      }
    />
  );
}
