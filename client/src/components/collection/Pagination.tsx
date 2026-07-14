import styled from "styled-components"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  isFetching?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.25rem 0.25rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Button = styled.button`
  appearance: none;
  border: 1px solid var(--border-color);
  background: var(--surface-bg, #fff);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.35rem 0.7rem;
  font: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--hover-bg);
  }
`

const Select = styled.select`
  appearance: none;
  border: 1px solid var(--border-color);
  background: var(--surface-bg, #fff);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  font: inherit;
`

export function Pagination({
  page,
  pageSize,
  total,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: PaginationProps) {
  if (total <= pageSize && page === 1) return null

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <Wrap aria-busy={isFetching || undefined}>
      <Meta>
        <span>
          {from}-{to} מתוך {total}
        </span>
        <label>
          בשורה:&nbsp;
          <Select
            value={pageSize}
            disabled={isFetching}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="גודל עמוד"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
      </Meta>
      <Controls>
        <Button
          type="button"
          disabled={isFetching || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          הקודם
        </Button>
        <span>
          עמוד {page} מתוך {pageCount}
        </span>
        <Button
          type="button"
          disabled={isFetching || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          הבא
        </Button>
      </Controls>
    </Wrap>
  )
}
