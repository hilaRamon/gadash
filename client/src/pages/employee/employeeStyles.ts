import styled from 'styled-components'

export const EmployeePage = styled.div`
  min-height: 100vh;
  background: var(--page-bg);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
`

export const EmployeeContent = styled.div`
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem 6rem;
  box-sizing: border-box;
`

export const EmployeeHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`

export const EmployeeTitle = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`

export const EmployeeSubtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
`

export const TextButton = styled.button`
  border: none;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 0.875rem;
  padding: 0.5rem;
  cursor: pointer;
  min-height: 48px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const BackButton = styled(TextButton)`
  padding-inline: 0;
  min-height: auto;
`

export const ActionCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

export const EmployeeActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`

export const ActionCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 64px;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
  transition: background 0.15s ease;

  &:hover {
    background: var(--hover-bg);
  }

  &:active {
    background: var(--active-bg);
  }
`

export const EmployeePickerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`

export const EmployeePickerButton = styled.button`
  width: 100%;
  min-height: 52px;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 1rem;
  text-align: right;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background: var(--hover-bg);
  }
`

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

export const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
`

export const FormInput = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export const FormSelect = styled.select`
  width: 100%;
  min-height: 48px;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  box-sizing: border-box;
  resize: vertical;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export const FieldError = styled.span`
  font-size: 0.8rem;
  color: #f87171;
`

export const ReadOnlyValue = styled.div`
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--hover-bg);
  color: var(--text-primary);
  font-size: 16px;
  box-sizing: border-box;
`

export const StickySubmitBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  background: var(--page-bg);
  border-top: 1px solid var(--border-color);
  z-index: 10;
`

export const StickySubmitInner = styled.div`
  max-width: 480px;
  margin: 0 auto;
`

export const SubmitButton = styled.button`
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #0f1419;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const ErrorBanner = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #fca5a5;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`

export const SuccessBanner = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--active-bg);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`

export const CollapseToggle = styled.button`
  border: none;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 0.875rem;
  padding: 0.25rem 0;
  cursor: pointer;
  text-align: right;
  align-self: flex-start;
`
