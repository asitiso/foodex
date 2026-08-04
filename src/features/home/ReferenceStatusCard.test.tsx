import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReferenceStatusCard } from './ReferenceStatusCard'

describe('ReferenceStatusCard', () => {
  it('renders value, helper text, progress, and callback', async () => {
    const onActivate = vi.fn()
    const user = userEvent.setup()

    render(
      <ReferenceStatusCard
        title="식사"
        value="2/3"
        helperText="연속 3일"
        progress={67}
        tone="meals"
        ariaLabel="오늘 식사 2/3, 연속 3일"
        onActivate={onActivate}
      />,
    )

    const button = screen.getByRole('button', { name: '오늘 식사 2/3, 연속 3일' })
    expect(button).toHaveAttribute('data-status-tone', 'meals')
    expect(button).toHaveAttribute('data-testid', 'reference-status-card')
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText('연속 3일')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67')

    await user.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
