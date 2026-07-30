import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CompanionRoom } from './CompanionRoom'

describe('CompanionRoom', () => {
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
})
