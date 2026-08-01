import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPANION_REACTIONS, HeroCompanion } from './HeroCompanion'

function renderOpenableCompanion(onOpenRoom: () => void) {
  const view = render(
    <HeroCompanion
      characterId="foody"
      emotion="happy"
      reducedMotion={false}
      onOpenRoom={onOpenRoom}
    />,
  )
  return {
    ...view,
    companion: view.container.querySelector<HTMLButtonElement>('.companion-character')!,
  }
}

function firePointer(target: Element, type: string, pointerId: number, clientX = 0, clientY = 0) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: 'touch' },
    clientX: { value: clientX },
    clientY: { value: clientY },
  })
  fireEvent(target, event)
}

describe('HeroCompanion', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders the selected layered character asset', () => {
    render(<HeroCompanion characterId="berry" emotion="happy" reducedMotion={false} />)

    expect(screen.getByRole('button', { name: '기뻐하는 베리' })).toHaveStyle({
      '--companion-art': 'url("/art/characters/berry.png")',
    })
  })

  it('cycles through the approved six reactions without consecutive repeats', async () => {
    const user = userEvent.setup()
    render(<HeroCompanion characterId="foody" emotion="happy" reducedMotion={false} />)
    const companion = screen.getByRole('button', { name: '기뻐하는 푸디' })
    const seen: string[] = []

    for (const expected of COMPANION_REACTIONS) {
      await user.click(companion)
      const current = companion.getAttribute('data-reaction')
      seen.push(current ?? '')
      expect(current).toBe(expected)
      expect(companion).toHaveClass(`reaction-${expected}`)
    }

    expect(new Set(seen)).toEqual(new Set(COMPANION_REACTIONS))
  })

  it('clears a temporary reaction after its display window', async () => {
    vi.useFakeTimers()
    render(<HeroCompanion characterId="foody" emotion="happy" reducedMotion={false} />)
    const companion = screen.getByRole('button', { name: '기뻐하는 푸디' })

    fireEvent.click(companion)
    expect(companion).toHaveAttribute('data-reaction', 'smile')

    act(() => vi.advanceTimersByTime(1900))
    expect(companion).not.toHaveAttribute('data-reaction')
  })

  it('marks the character as reduced motion without removing its identity', () => {
    render(<HeroCompanion characterId="cocoa" emotion="calm" reducedMotion />)

    expect(screen.getByRole('button', { name: '차분한 코코아' })).toHaveClass('reduced-motion')
  })

  it('opens the room after a 600ms pointer hold', () => {
    vi.useFakeTimers()
    const onOpenRoom = vi.fn()
    const { companion } = renderOpenableCompanion(onOpenRoom)

    firePointer(companion, 'pointerdown', 1, 4, 8)
    vi.advanceTimersByTime(600)

    expect(onOpenRoom).toHaveBeenCalledOnce()
  })

  it('cancels room navigation when the active pointer is released early', () => {
    vi.useFakeTimers()
    const onOpenRoom = vi.fn()
    const { companion } = renderOpenableCompanion(onOpenRoom)

    firePointer(companion, 'pointerdown', 1, 4, 8)
    firePointer(companion, 'pointerup', 1)
    vi.advanceTimersByTime(600)

    expect(onOpenRoom).not.toHaveBeenCalled()
  })

  it('cancels room navigation when the active pointer moves', () => {
    vi.useFakeTimers()
    const onOpenRoom = vi.fn()
    const { companion } = renderOpenableCompanion(onOpenRoom)

    firePointer(companion, 'pointerdown', 1, 4, 8)
    firePointer(companion, 'pointermove', 1, 12, 8)
    vi.advanceTimersByTime(600)

    expect(onOpenRoom).not.toHaveBeenCalled()
  })

  it('keeps the active hold bound to its original pointer', () => {
    vi.useFakeTimers()
    const onOpenRoom = vi.fn()
    const { companion } = renderOpenableCompanion(onOpenRoom)

    firePointer(companion, 'pointerdown', 1, 4, 8)
    firePointer(companion, 'pointerdown', 2, 12, 8)
    firePointer(companion, 'pointerup', 1)
    vi.advanceTimersByTime(600)

    expect(onOpenRoom).not.toHaveBeenCalled()
  })

  it('opens the room through the keyboard-accessible fallback button', async () => {
    const user = userEvent.setup()
    const onOpenRoom = vi.fn()
    const { container } = render(
      <HeroCompanion
        characterId="foody"
        emotion="happy"
        reducedMotion={false}
        onOpenRoom={onOpenRoom}
      />,
    )

    await user.click(container.querySelector('.companion-room-action')!)

    expect(onOpenRoom).toHaveBeenCalledOnce()
  })
})
