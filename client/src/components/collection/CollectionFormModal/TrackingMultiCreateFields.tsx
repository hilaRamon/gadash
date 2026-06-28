import styled from "styled-components";
import type { CollectionDocument } from "../../../schema/types";
import { ReferenceFieldSelect } from "../ReferenceFieldSelect";
import { fieldControlStyles } from "./sharedStyles";

export type TrackingMultiCreateEntry = {
  itemId: string;
  amount: string;
};

type TrackingMultiCreateFieldsProps = {
  sectionLabel: string;
  selectionErrorKey: string;
  referenceCollection: string;
  referenceFieldLabel: string;
  amountLabel: string;
  items: CollectionDocument[];
  entries: TrackingMultiCreateEntry[];
  fieldErrors: Record<string, string>;
  amountDisabled?: boolean;
  referenceFilter?: (row: CollectionDocument) => boolean;
  getItemLabel: (itemId: string) => string;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onUpdateLine: (
    itemId: string,
    patch: Partial<Pick<TrackingMultiCreateEntry, "itemId" | "amount">>,
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

export function TrackingMultiCreateFields({
  sectionLabel,
  selectionErrorKey,
  referenceCollection,
  referenceFieldLabel,
  amountLabel,
  items,
  entries,
  fieldErrors,
  amountDisabled = false,
  referenceFilter,
  getItemLabel,
  onToggleItem,
  onUpdateLine,
}: TrackingMultiCreateFieldsProps) {
  const selectedIds = new Set(entries.map((entry) => entry.itemId));

  return (
    <Section>
      <SectionLabel>{sectionLabel}</SectionLabel>
      <CheckboxList>
        {items.map((item) => {
          const itemId = String(item._id);
          return (
            <CheckboxRow key={itemId}>
              <input
                type="checkbox"
                checked={selectedIds.has(itemId)}
                onChange={(e) => onToggleItem(itemId, e.target.checked)}
              />
              <span>{getItemLabel(itemId)}</span>
            </CheckboxRow>
          );
        })}
      </CheckboxList>
      {fieldErrors[selectionErrorKey] && (
        <FieldErrorMessage>{fieldErrors[selectionErrorKey]}</FieldErrorMessage>
      )}

      {entries.length > 0 && (
        <EntryList>
          {entries.map((entry) => (
            <EntryCard key={entry.itemId}>
              <EntryTitle>{getItemLabel(entry.itemId)}</EntryTitle>
              <div>
                <FieldLabel htmlFor={`line-ref-${entry.itemId}`}>
                  {referenceFieldLabel}
                </FieldLabel>
                <ReferenceFieldSelect
                  collection={referenceCollection}
                  value={entry.itemId}
                  required
                  filterOption={referenceFilter}
                  onChange={(nextItemId) =>
                    onUpdateLine(entry.itemId, { itemId: nextItemId })
                  }
                />
              </div>
              <div>
                <FieldLabel htmlFor={`line-amount-${entry.itemId}`}>
                  {amountLabel}
                </FieldLabel>
                <AmountInput
                  id={`line-amount-${entry.itemId}`}
                  type="number"
                  dir="ltr"
                  value={entry.amount !== "0" ? entry.amount : ""}
                  disabled={amountDisabled}
                  onChange={(e) =>
                    onUpdateLine(entry.itemId, { amount: e.target.value })
                  }
                  required
                />
              </div>
              {fieldErrors[entry.itemId] && (
                <FieldErrorMessage>
                  {fieldErrors[entry.itemId]}
                </FieldErrorMessage>
              )}
            </EntryCard>
          ))}
        </EntryList>
      )}
    </Section>
  );
}
