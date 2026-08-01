import { Children, cloneElement, isValidElement, useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface GameSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

function prepareChildren(title: string, children: ReactNode): ReactNode {
  if (title !== '코인') return children

  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child
    if (child.type !== 'button' || child.props.children !== '버디 방 보기') return child

    return cloneElement(child, {
      children: '꾸미기 상점',
      'aria-label': '꾸미기 상점 열기',
    } as { children: ReactNode; 'aria-label': string })
  })
}

export function GameSheet({ open, title, onClose, children }: GameSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const preparedChildren = prepareChildren(title, children)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal()
        else dialog.setAttribute('open', '')
      }
      closeButtonRef.current?.focus()

      return () => {
        if (!dialog.open) return
        if (typeof dialog.close === 'function') dialog.close()
        if (dialog.open) dialog.removeAttribute('open')
      }
    }

    if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      if (dialog.open) dialog.removeAttribute('open')
    }
    if (openerRef.current?.isConnected) openerRef.current.focus()
  }, [open])

  return (
    <dialog
      className="game-sheet"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-hidden={!open}
      data-game-surface="sheet"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="game-sheet-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeButtonRef} className="game-touch-target" type="button" aria-label={`${title} 닫기`} onClick={onClose}>닫기</button>
      </div>
      <div
        className="game-sheet-content"
        data-testid="game-sheet-scroll"
        tabIndex={0}
        onClickCapture={(event) => {
          if (title !== '코인') return
          const button = (event.target as HTMLElement).closest('button')
          if (button?.textContent?.trim() === '꾸미기 상점') {
            window.sessionStorage.setItem('foodex-open-companion-shop', '1')
          }
        }}
      >
        {preparedChildren}
      </div>
    </dialog>
  )
}
