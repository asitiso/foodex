import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface GameSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function GameSheet({ open, title, onClose, children }: GameSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    closeButtonRef.current?.focus()

    return () => {
      if (dialog.open) {
        if (typeof dialog.close === 'function') dialog.close()
        else dialog.removeAttribute('open')
      }
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      className="game-sheet"
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="game-sheet-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeButtonRef} type="button" aria-label={`${title} 닫기`} onClick={onClose}>닫기</button>
      </div>
      <div className="game-sheet-content">{children}</div>
    </dialog>
  )
}
