import type { ReactNode } from 'react';
import styled from 'styled-components';
import { ExportButton } from '../collection/CollectionToolbar/ExportButton';
import { GlobalSearch } from '../collection/CollectionToolbar/GlobalSearch';

export const PageHeader = styled.header<{ $stacked?: boolean }>`
  display: flex;
  flex-direction: ${({ $stacked }) => ($stacked ? 'column' : 'row')};
  flex-wrap: wrap;
  align-items: ${({ $stacked }) => ($stacked ? 'stretch' : 'center')};
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const PageHeaderTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
`;

export const HeaderTitles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
`;

export const PageTitle = styled.h1`
  margin: 0;
  flex-shrink: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  direction: ltr;
  justify-content: flex-start;
`;

type ExportSearchToolbarProps = {
  globalSearch: string;
  exportDisabled?: boolean;
  onGlobalSearchChange: (value: string) => void;
  onExportExcel: () => void;
};

export function ExportSearchToolbar({
  globalSearch,
  exportDisabled = false,
  onGlobalSearchChange,
  onExportExcel,
}: ExportSearchToolbarProps) {
  return (
    <Toolbar>
      <ExportButton disabled={exportDisabled} onClick={onExportExcel} />
      <GlobalSearch value={globalSearch} onChange={onGlobalSearchChange} />
    </Toolbar>
  );
}

type PageHeaderWithToolbarProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  toolbar: ReactNode;
  stacked?: boolean;
  children?: ReactNode;
};

export function PageHeaderWithToolbar({
  title,
  subtitle,
  toolbar,
  stacked = false,
  children,
}: PageHeaderWithToolbarProps) {
  return (
    <PageHeader $stacked={stacked}>
      <PageHeaderTop>
        {subtitle != null ? (
          <HeaderTitles>
            <PageTitle>{title}</PageTitle>
            <PageSubtitle>{subtitle}</PageSubtitle>
          </HeaderTitles>
        ) : (
          <PageTitle>{title}</PageTitle>
        )}
        {toolbar}
      </PageHeaderTop>
      {children}
    </PageHeader>
  );
}
