import styled from 'styled-components'

/* =========================================================================
 * GlobalSearch
 * Free-text input that searches across all fields of the collection.
 * Equivalent of `.collection-toolbar-search-group` / `-search` /
 * `.collection-global-search`.
 * ========================================================================= */

const SearchGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`

const SearchWrap = styled.div`
  min-width: 8rem;
  width: 14rem;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--color-toolbar-search-bg);
  color: var(--color-toolbar-search-text);
  font: inherit;
  font-size: 0.875rem;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

type GlobalSearchProps = {
  value: string
  onChange: (value: string) => void
}

export function GlobalSearch({ value, onChange }: GlobalSearchProps) {
  return (
    <SearchGroup>
      <SearchWrap>
        <SearchInput
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="חיפוש בכל השדות..."
          aria-label="חיפוש בכל השדות"
          dir="rtl"
        />
      </SearchWrap>
    </SearchGroup>
  )
}
