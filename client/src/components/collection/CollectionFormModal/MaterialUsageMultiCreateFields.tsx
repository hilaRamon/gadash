import styled from "styled-components";
import type { CollectionDocument } from "../../../schema/types";
import { ReferenceFieldSelect } from "../ReferenceFieldSelect";
import { fieldControlStyles } from "./sharedStyles";
import type { MaterialUsageLineEntry } from "./materialUsageTrackingForm";

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

const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionLabel = styled.div`
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 10rem;
  overflow-y: auto;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const EntryCard = styled.div`
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
`;

const EntryTitle = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
`;

const AmountInput = styled.input`
  ${fieldControlStyles}
`;

const FieldErrorMessage = styled.p`
  margin: 0.35rem 0 0;
  color: #fc8181;
  font-size: 0.75rem;
`;

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
  const selectedIds = new Set(entries.map((entry) => entry.materialId));

  return (
    <Section>
      <SectionLabel>חומרים *</SectionLabel>
      <CheckboxList>
        {materials.map((material) => {
          const materialId = String(material._id);
          return (
            <CheckboxRow key={materialId}>
              <input
                type="checkbox"
                checked={selectedIds.has(materialId)}
                onChange={(e) => onToggleMaterial(materialId, e.target.checked)}
              />
              <span>{getMaterialName(materials, materialId)}</span>
            </CheckboxRow>
          );
        })}
      </CheckboxList>
      {fieldErrors.materials && (
        <FieldErrorMessage>{fieldErrors.materials}</FieldErrorMessage>
      )}

      {entries.length > 0 && (
        <EntryList>
          {entries.map((entry) => (
            <EntryCard key={entry.materialId}>
              <EntryTitle>{getMaterialName(materials, entry.materialId)}</EntryTitle>
              <div>
                <FieldLabel htmlFor={`material-line-${entry.materialId}`}>
                  חומר
                </FieldLabel>
                <ReferenceFieldSelect
                  collection="materials"
                  value={entry.materialId}
                  required
                  onChange={(nextMaterialId) =>
                    onUpdateLine(entry.materialId, { materialId: nextMaterialId })
                  }
                />
              </div>
              <div>
                <FieldLabel htmlFor={`amount-line-${entry.materialId}`}>
                  כמות
                </FieldLabel>
                <AmountInput
                  id={`amount-line-${entry.materialId}`}
                  type="number"
                  dir="ltr"
                  value={entry.amount}
                  disabled={!plotId}
                  onChange={(e) =>
                    onUpdateLine(entry.materialId, { amount: e.target.value })
                  }
                  required
                />
              </div>
              {fieldErrors[entry.materialId] && (
                <FieldErrorMessage>{fieldErrors[entry.materialId]}</FieldErrorMessage>
              )}
            </EntryCard>
          ))}
        </EntryList>
      )}
    </Section>
  );
}
