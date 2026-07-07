import { useMemo } from "react";
import styled from "styled-components";
import { DataTable } from "@/components/collection/DataTable/DataTable";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import type { CollectionDocument, CollectionSchema } from "@/schema/types";

export type PreviewSectionProps = {
  title: string;
  schema: CollectionSchema;
  rows: CollectionDocument[];
  includedIds: Set<string>;
  onToggleInclude: (id: string) => void;
  onToggleIncludeAll: (ids: string[], included: boolean) => void;
  onCellChange?: (
    row: CollectionDocument,
    key: string,
    value: unknown,
  ) => void | Promise<void>;
};

export function PreviewSection({
  title,
  schema,
  rows,
  includedIds,
  onToggleInclude,
  onToggleIncludeAll,
  onCellChange,
}: PreviewSectionProps) {
  const tableQuery = useTableQueryState(schema);
  const noop = () => {};

  const includeSelection = useMemo(
    () => ({
      isIncluded: (id: string) => includedIds.has(id),
      onToggleInclude,
      onToggleIncludeAll: (ids: string[]) => {
        const allIncluded =
          ids.length > 0 && ids.every((id) => includedIds.has(id));
        onToggleIncludeAll(ids, !allIncluded);
      },
    }),
    [includedIds, onToggleInclude, onToggleIncludeAll],
  );

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <SectionCount>{rows.length} פריטים</SectionCount>
      </SectionHeader>
      <DataTable
        schema={schema}
        rows={rows}
        queryState={tableQuery.state}
        onColumnSearchChange={tableQuery.setColumnSearch}
        onToggleSelect={noop}
        onToggleSelectAll={noop}
        onEdit={noop}
        onDelete={noop}
        onCellChange={onCellChange}
        previewMode
        previewIncludeSelection={includeSelection}
      />
    </Section>
  );
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const SectionCount = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
`;
