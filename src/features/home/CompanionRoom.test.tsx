import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompanionRoom } from './CompanionRoom'

describe('CompanionRoom', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })
  it('renders the emotion, line, and stable decoration layers', async () => {
    const onOpenCompanion = vi.fn()
    render(
      <CompanionRoom
        emotion="happy"
        line="새 친구를 환영해!"
        decorationIds={['small-plant', 'food-poster']}
        reducedMotion={false}
        onOpenCompanion={onOpenCompanion}
      />,
    )

    expect(screen.getByLabelText('기뻐하는 푸디')).toHaveClass('emotion-happy')
    expect(screen.getByTestId('decoration-small-plant')).toHaveAttribute('data-decoration-id', 'small-plant')
    expect(screen.getByTestId('decoration-food-poster')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '새 친구를 환영해!' }))
    expect(onOpenCompanion).toHaveBeenCalledOnce()
  })

  it('disables character motion when reduced motion is requested', () => {
    render(
      <CompanionRoom
        emotion="calm"
        line="천천히 시작해 볼까?"
        decorationIds={[]}
        reducedMotion
        onOpenCompanion={() => undefined}
      />,
    )

    expect(screen.getByLabelText('차분한 푸디').closest('.companion-room')).toHaveClass('reduced-motion')
  })

  it('lets the character and room objects react to taps', async () => {
    render(
      <CompanionRoom
        emotion="happy"
        line="오늘도 같이 놀자!"
        decorationIds={['small-plant']}
        reducedMotion={false}
        onOpenCompanion={() => undefined}
      />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: /푸디/ }).at(-1)!)
    expect(screen.getByText(/통통/)).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: /창문/ }).at(-1)!)
    expect(screen.getByText(/바람/)).toBeInTheDocument()
    await userEvent.click(screen.getAllByTestId('decoration-small-plant').at(-1)!)
    expect(screen.getByText(/화분/)).toBeInTheDocument()
  })

  it('shows a tactile sparkle when the character is clicked', async () => {
    render(
      <CompanionRoom
        emotion="happy"
        line="click me"
        decorationIds={[]}
        reducedMotion={false}
        onOpenCompanion={() => undefined}
      />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: /푸디/ }).at(-1)!)
    expect(screen.getAllByTestId('companion-click-sparkle').at(-1)).toBeInTheDocument()
  })

  it('varies the character motion on consecutive clicks', async () => {
    render(
      <CompanionRoom
        emotion="happy"
        line="click me"
        decorationIds={[]}
        reducedMotion={false}
        onOpenCompanion={() => undefined}
      />,
    )

    const character = () => screen.getAllByRole('button', { name: /푸디/ }).at(-1)!
    await userEvent.click(character())
    const firstMotion = character().className
    await userEvent.click(character())
    expect(character().className).not.toBe(firstMotion)
  })

  it('clears pending click reactions when the room unmounts', async () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout')
    const view = render(
      <CompanionRoom
        emotion="happy"
        line="click me"
        decorationIds={[]}
        reducedMotion={false}
        onOpenCompanion={() => undefined}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: '기뻐하는 푸디' }))
    view.unmount()

    expect(clearTimeout).toHaveBeenCalledTimes(3)
  })
})
