import type { GroupBase, StylesConfig } from 'react-select'
import type { SelectOption } from './SearchableSelect'

const MENU_Z_INDEX = 110

export function getSearchableSelectStyles(
  size: 'default' | 'large' = 'default',
): StylesConfig<SelectOption, false, GroupBase<SelectOption>> {
  const minHeight = size === 'large' ? '48px' : '2.25rem'
  const fontSize = size === 'large' ? '16px' : '0.875rem'
  const padding = size === 'large' ? '0.65rem 0.75rem' : '0.5rem 0.65rem'

  return {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (base, state) => ({
      ...base,
      minHeight,
      borderRadius: '8px',
      borderColor: state.isFocused ? 'var(--accent)' : 'var(--border-color)',
      backgroundColor: 'var(--page-bg)',
      boxShadow: state.isFocused ? '0 0 0 2px var(--accent)' : 'none',
      fontSize,
      '&:hover': {
        borderColor: state.isFocused ? 'var(--accent)' : 'var(--border-color)',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding,
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: 'var(--text-primary)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--text-muted)',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--text-primary)',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--text-secondary)',
      padding: '0 0.5rem',
      '&:hover': {
        color: 'var(--text-primary)',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--text-secondary)',
      padding: '0 0.25rem',
      '&:hover': {
        color: 'var(--text-primary)',
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: MENU_Z_INDEX,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      backgroundColor: 'var(--page-bg)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.25rem 0',
      maxHeight: '240px',
    }),
    option: (base, state) => ({
      ...base,
      fontSize,
      color: 'var(--text-primary)',
      backgroundColor: state.isSelected
        ? 'var(--active-bg)'
        : state.isFocused
          ? 'var(--hover-bg)'
          : 'transparent',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--active-bg)',
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize,
      color: 'var(--text-secondary)',
    }),
    loadingMessage: (base) => ({
      ...base,
      fontSize,
      color: 'var(--text-secondary)',
    }),
  }
}
