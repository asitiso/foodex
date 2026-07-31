import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameSheet } from './GameSheet'

describe('GameSheet', () => {
  afterEach(cleanup)

  it('opens as a modal dialog and closes from its control', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GameSheet open title="성장 보기" onClose={onClose}><p>내용</p></GameSheet>)

    expect(screen.getByRole('dialog', { name: '성장 보기' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '성장 보기 닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('forwards the native cancel event, including Escape, to the close handler', () => {
    const onClose = vi.fn()
    render(<GameSheet open title="상점" onClose={onClose}><p>내용</p></GameSheet>)
    const dialog = screen.getByRole('dialog', { name: '상점' })

    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('focuses the close control when opened', () => {
    render(<GameSheet open title="식사 현황" onClose={vi.fn()}><p>내용</p></GameSheet>)

    expect(screen.getByRole('button', { name: '식사 현황 닫기' })).toHaveFocus()
  })

  it('does not expose a dialog while closed', () => {
    render(<GameSheet open={false} title="코인" onClose={vi.fn()}><p>내용</p></GameSheet>)

    expect(screen.queryByRole('dialog', { name: '코인' })).not.toBeInTheDocument()
  })
})
