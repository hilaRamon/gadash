import type { HTMLAttributes, MouseEvent, ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { buttonHoverLighten } from '@/styles/buttonStyles'

type ModalOverlayLayout = 'centered' | 'scrollable'

type ModalOverlayProps = {
  open: boolean
  onClose: () => void
  layout?: ModalOverlayLayout
  children: ReactNode
}

type ModalPanelProps = {
  maxWidth?: string
  scrollable?: boolean
  title?: ReactNode
  titleId?: string
  onClose?: () => void
  children: ReactNode
} & Pick<
  HTMLAttributes<HTMLDivElement>,
  'role' | 'aria-modal' | 'aria-labelledby'
>

const Overlay = styled.div<{ $layout: ModalOverlayLayout }>`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);

  ${({ $layout }) =>
    $layout === 'scrollable'
      ? css`
          align-items: flex-start;
          padding: 1.5rem 1rem;
          overflow-y: auto;
        `
      : css`
          align-items: center;
          padding: 1rem;
        `}
`

const Shell = styled.div<{
  $maxWidth: string
  $scrollable: boolean
  $sectioned: boolean
}>`
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  border-radius: 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);

  ${({ $sectioned }) =>
    $sectioned &&
    css`
      margin: auto;
    `}

  ${({ $scrollable }) =>
    $scrollable &&
    css`
      max-height: 90vh;
      overflow-y: auto;
    `}
`

const PaddedContent = styled.div`
  padding: 1.5rem;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
`

const DialogTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 700;
`

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
`

const Body = styled.div`
  padding: 1.25rem;
`

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;

  ${buttonHoverLighten};

  &:hover {
    color: var(--text-primary);
  }
`

export function ModalOverlay({
  open,
  onClose,
  layout = 'centered',
  children,
}: ModalOverlayProps) {
  if (!open) return null

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <Overlay
      role="presentation"
      $layout={layout}
      onMouseDown={handleBackdropMouseDown}
    >
      {children}
    </Overlay>
  )
}

export function ModalPanel({
  maxWidth = '28rem',
  scrollable = false,
  title,
  titleId,
  onClose,
  children,
  role,
  'aria-modal': ariaModal,
  'aria-labelledby': ariaLabelledby,
}: ModalPanelProps) {
  const isSectioned = title != null && onClose != null

  return (
    <Shell
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledby}
      $maxWidth={maxWidth}
      $scrollable={scrollable}
      $sectioned={isSectioned}
    >
      {isSectioned ? (
        <>
          <Header>
            <HeaderTitle id={titleId}>{title}</HeaderTitle>
            <CloseButton type="button" onClick={onClose} aria-label="סגירה">
              ×
            </CloseButton>
          </Header>
          <Body>{children}</Body>
        </>
      ) : (
        <PaddedContent>
          {title != null && <DialogTitle id={titleId}>{title}</DialogTitle>}
          {children}
        </PaddedContent>
      )}
    </Shell>
  )
}
